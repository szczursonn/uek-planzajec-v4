package server

import (
	"context"
	"errors"
	"log/slog"
	"net/http"

	"github.com/szczursonn/uek-planzajec-v4-server/internal/uekschedule"
)

func (srv *Server) handleRequestDataGroupings(w http.ResponseWriter, r *http.Request, basicAuthValue string) {
	groupings, err := srv.uekSchedule.GetGroupings(r.Context(), uekschedule.UEKCallParams{
		BasicAuthHeaderValue: basicAuthValue,
		ForwaredForHeader:    getForwaredForWithLastHop(r),
	})
	if err != nil {
		if errors.Is(err, uekschedule.ErrUnauthorized) {
			respondUnauthorized(w)
		} else if !errors.Is(err, context.Canceled) {
			srv.logger.Error("Failed to get groupings", slog.Any("err", err))
			respondServiceUnavailable(w)
		}
		return
	}

	respondJSON(w, groupings)
}
