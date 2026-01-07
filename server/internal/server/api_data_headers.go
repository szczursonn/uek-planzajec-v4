package server

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"github.com/szczursonn/uek-planzajec-v4-server/internal/uekschedule"
)

func (srv *Server) handleRequestDataHeaders(w http.ResponseWriter, r *http.Request, basicAuthValue string) {
	queryParams := r.URL.Query()
	scheduleType, groupingName := uekschedule.ScheduleType(strings.TrimSpace(queryParams.Get("type"))), strings.TrimSpace(queryParams.Get("grouping"))

	if !scheduleType.IsValid() {
		respondBadRequest(w)
		return
	}

	headers, err := srv.uekSchedule.GetHeaders(r.Context(), uekschedule.UEKCallParams{
		BasicAuthHeaderValue: basicAuthValue,
		ForwaredForHeader:    getForwaredForWithLastHop(r),
	}, scheduleType, groupingName)
	if err != nil {
		if errors.Is(err, uekschedule.ErrUnauthorized) {
			respondUnauthorized(w)
		} else if !errors.Is(err, context.Canceled) {
			srv.logger.Error("Failed to get headers", slog.Group("params", slog.String("scheduleType", string(scheduleType)), slog.String("groupingName", groupingName)), slog.Any("err", err))
			respondServiceUnavailable(w)
		}
		return
	}

	respondJSON(w, headers)
}
