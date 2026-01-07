package server

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"slices"
	"strconv"
	"strings"

	"github.com/szczursonn/uek-planzajec-v4-server/internal/uekschedule"
)

func (srv *Server) handleRequestDataAggregateSchedule(w http.ResponseWriter, r *http.Request, basicAuthValue string) {
	queryParams := r.URL.Query()
	scheduleType := uekschedule.ScheduleType(strings.TrimSpace(queryParams.Get("type")))
	if !scheduleType.IsValid() {
		respondBadRequest(w)
		return
	}

	rawScheduleIds := queryParams["id"]
	if len(rawScheduleIds) == 0 || len(rawScheduleIds) > maxSchedulesPerRequest {
		respondBadRequest(w)
		return
	}

	scheduleIds := make([]int, 0, len(rawScheduleIds))
	for _, rawScheduleId := range rawScheduleIds {
		scheduleId, err := strconv.Atoi(strings.TrimSpace(rawScheduleId))
		if err != nil || slices.Contains(scheduleIds, scheduleId) {
			respondBadRequest(w)
			return
		}

		scheduleIds = append(scheduleIds, scheduleId)
	}

	periodIdx, err := strconv.Atoi(strings.TrimSpace(queryParams.Get("periodIdx")))
	if err != nil {
		respondBadRequest(w)
		return
	}

	aggregateSchedule, periods, err := srv.uekSchedule.GetAggregateSchedule(r.Context(), uekschedule.UEKCallParams{
		BasicAuthHeaderValue: basicAuthValue,
		ForwaredForHeader:    getForwaredForWithLastHop(r),
	}, scheduleType, scheduleIds, periodIdx)
	if err != nil {
		if errors.Is(err, uekschedule.ErrUnauthorized) {
			respondUnauthorized(w)
		} else if !errors.Is(err, context.Canceled) {
			srv.logger.Error("Failed to get aggregate schedule", slog.Group("params", slog.String("scheduleType", string(scheduleType)), slog.Any("scheduleIds", scheduleIds), slog.Int("periodIdx", periodIdx)), slog.Any("err", err))
			respondServiceUnavailable(w)
		}
		return
	}

	respondJSON(w, struct {
		AggregateSchedule *uekschedule.AggregateSchedule `json:"aggregateSchedule"`
		Periods           []uekschedule.SchedulePeriod   `json:"periods"`
	}{
		AggregateSchedule: aggregateSchedule,
		Periods:           periods,
	})
}
