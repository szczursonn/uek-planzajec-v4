package main

import (
	"context"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"time"
	_ "time/tzdata"

	"github.com/joho/godotenv"
	"github.com/szczursonn/uek-planzajec-v4-server/internal/config"
	"github.com/szczursonn/uek-planzajec-v4-server/internal/server"
	"github.com/szczursonn/uek-planzajec-v4-server/internal/uekmock"
	"github.com/szczursonn/uek-planzajec-v4-server/internal/uekschedule"
)

var cfg config.Config
var logger *slog.Logger
var ctx context.Context
var cancelCtx context.CancelFunc

var mockDownloadUrl string

func main() {
	os.Exit(run())
}

func run() int {
	godotenv.Overload()
	cfg = config.FromEnv()

	logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: func() slog.Level {
			if cfg.Debug {
				return slog.LevelDebug
			}
			return slog.LevelInfo
		}(),
	}))
	slog.SetDefault(logger)

	flag.StringVar(&mockDownloadUrl, "mockdl", "", "url to download mock data from")
	flag.Parse()

	ctx, cancelCtx = signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancelCtx()
	go func() {
		// ensure subsequent interrupts kill app immediately
		<-ctx.Done()
		cancelCtx()
		logger.Info("Shutting down...")
	}()

	if mockDownloadUrl != "" {
		return runMockDownload()
	}

	return runServer()
}

func runMockDownload() int {
	logger.Info("Downloading mock response...", slog.String("downloadUrl", mockDownloadUrl))
	filePath, err := uekmock.New(cfg.Mock, http.DefaultTransport).DownloadResponse(ctx, mockDownloadUrl)

	if err != nil {
		logger.Error("Failed to download mock response", slog.Any("err", err))
		return 1
	}

	logger.Info("Done!", slog.String("filePath", filePath))
	return 0
}

func runServer() int {
	uekHttpClient := http.DefaultClient
	if cfg.Mock.Enabled {
		uekHttpClient = &http.Client{
			Transport: uekmock.New(cfg.Mock, http.DefaultTransport),
		}
	}

	uekClient, err := uekschedule.NewClient(uekHttpClient, logger, cfg.UEK)
	if err != nil {
		logger.Error("Failed to create UEK client", slog.Any("err", err))
		return 1
	}

	srv, err := server.New(cfg.Server, uekClient, logger)
	if err != nil {
		logger.Error("Failed to initialize HTTP server", slog.Any("err", err))
		return 1
	}
	go func() {
		logger.Info("Server started",
			slog.Bool("debug", cfg.Debug),
			slog.String("addr", cfg.Server.Addr),
			slog.Group("uek",
				slog.String("userAgent", cfg.UEK.UserAgent),
				slog.Int("maxConcurrentRequests", cfg.UEK.MaxConcurrentRequests)),
			slog.Bool("mock", cfg.Mock.Enabled),
		)
		if err := srv.Run(); err != nil {
			logger.Error("Server stopped unexpectedly", slog.Any("err", err))
		}
		cancelCtx()
	}()

	<-ctx.Done()

	shutdownCtx, cancelShutdownCtx := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShutdownCtx()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("Failed to shut down HTTP server gracefully", slog.Any("err", err))
		return 1
	}

	logger.Info("Shut down gracefully")

	return 0
}
