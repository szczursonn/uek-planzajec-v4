package server

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/szczursonn/uek-planzajec-v4-server/internal/bufferutil"
	"github.com/szczursonn/uek-planzajec-v4-server/internal/config"
	"github.com/szczursonn/uek-planzajec-v4-server/internal/encryption"
	"github.com/szczursonn/uek-planzajec-v4-server/internal/uekschedule"
)

const bufferPoolBaseBuffSize = 32 * 1024

const maxSchedulesPerRequest = 4

type Server struct {
	httpServer                  http.Server
	uekSchedule                 *uekschedule.Client
	logger                      *slog.Logger
	bufferPool                  *bufferutil.BufferPool
	encryption                  *encryption.Service
	staticAssetPathToMetadata   map[string]staticAssetMetadata
	staticAssetPathToMetadataMu sync.RWMutex
}

func New(cfg config.Server, uekScheduleClient *uekschedule.Client, logger *slog.Logger) (*Server, error) {
	bufferPool := bufferutil.NewBufferPool(bufferPoolBaseBuffSize)
	encryptionService, err := encryption.NewService([]byte(cfg.EncryptionKey), bufferPool)
	if err != nil {
		return nil, fmt.Errorf("failed to create encryption service: %w", err)
	}

	mux := http.NewServeMux()
	srv := &Server{
		httpServer: http.Server{
			Addr:              cfg.Addr,
			ReadHeaderTimeout: 10 * time.Second,
			WriteTimeout:      30 * time.Second,
			IdleTimeout:       30 * time.Second,
			Handler:           mux,
			ErrorLog:          slog.NewLogLogger(logger.With(slog.String("source", "http.Server")).Handler(), slog.LevelError),
		},
		uekSchedule:               uekScheduleClient,
		logger:                    logger,
		bufferPool:                bufferPool,
		encryption:                encryptionService,
		staticAssetPathToMetadata: map[string]staticAssetMetadata{},
	}

	mux.HandleFunc("GET /", srv.applyDebugLoggingMiddleware(srv.handleRequestStaticAsset))
	mux.HandleFunc("GET /api/", srv.applyDebugLoggingMiddleware(func(w http.ResponseWriter, r *http.Request) {
		respondNotFound(w)
	}))
	mux.HandleFunc("POST /api/auth/encrypt-basic-auth", srv.applyDebugLoggingMiddleware(srv.applyRequireAuthMiddleware(srv.handleRequestAuthEncryptBasicAuth)))
	mux.HandleFunc("GET /api/data/groupings", srv.applyDebugLoggingMiddleware(srv.applyRequireAuthMiddleware(srv.handleRequestDataGroupings)))
	mux.HandleFunc("GET /api/data/headers", srv.applyDebugLoggingMiddleware(srv.applyRequireAuthMiddleware(srv.handleRequestDataHeaders)))
	mux.HandleFunc("GET /api/data/aggregate-schedule", srv.applyDebugLoggingMiddleware(srv.applyRequireAuthMiddleware(srv.handleRequestDataAggregateSchedule)))
	mux.HandleFunc("GET /api/ical/{payload}", srv.applyDebugLoggingMiddleware(srv.handleRequestICal))

	return srv, nil
}

func (srv *Server) Run() error {
	if err := srv.httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}

	return nil
}

func (srv *Server) Shutdown(ctx context.Context) error {
	return srv.httpServer.Shutdown(ctx)
}

func (srv *Server) extractBasicAuthValueFromRequest(r *http.Request) string {
	authScheme, authValue, _ := strings.Cut(r.Header.Get("Authorization"), " ")
	return srv.extractBasicAuthValue(authScheme, authValue)
}

func (srv *Server) extractBasicAuthValue(authScheme string, authValue string) string {
	switch authScheme {
	case "Basic":
		return authValue
	case "Bearer":
		if decryptedBasicAuthValue, err := srv.encryption.DecryptText(authValue); err == nil {
			return decryptedBasicAuthValue
		}
	}

	return ""
}

func getForwaredForWithLastHop(r *http.Request) string {
	forwardedFor := r.Header.Get("X-Forwarded-For")
	if forwardedFor == "" {
		forwardedFor = r.RemoteAddr
	} else {
		forwardedFor += ", " + r.RemoteAddr
	}
	return forwardedFor
}

func (srv *Server) applyDebugLoggingMiddleware(handler http.HandlerFunc) http.HandlerFunc {
	if !srv.logger.Enabled(context.Background(), slog.LevelDebug) {
		return handler
	}

	return func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()
		handler(w, r)
		srv.logger.DebugContext(r.Context(), "Request handled", slog.String("url", r.URL.String()), slog.String("proto", r.Proto), slog.String("sourceAddrs", getForwaredForWithLastHop(r)), slog.String("timeTaken", time.Since(startTime).String()))
	}
}

func (srv *Server) applyRequireAuthMiddleware(handler func(w http.ResponseWriter, r *http.Request, basicAuthValue string)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		basicAuthValue := srv.extractBasicAuthValueFromRequest(r)

		if basicAuthValue == "" {
			respondUnauthorized(w)
			return
		}

		handler(w, r, basicAuthValue)
	}
}

func respondJSON(w http.ResponseWriter, val any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(val)
}

func respondNotFound(w http.ResponseWriter) {
	http.Error(w, "Not Found", http.StatusNotFound)
}

func respondBadRequest(w http.ResponseWriter) {
	http.Error(w, "Bad Request", http.StatusBadRequest)
}

func respondUnauthorized(w http.ResponseWriter) {
	http.Error(w, "Unauthorized", http.StatusUnauthorized)
}

func respondInternalServerError(w http.ResponseWriter) {
	http.Error(w, "Internal Server Error", http.StatusInternalServerError)
}

func respondServiceUnavailable(w http.ResponseWriter) {
	http.Error(w, "Service Unavailable", http.StatusServiceUnavailable)
}
