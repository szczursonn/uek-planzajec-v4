package server

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/szczursonn/uek-planzajec-v4-server/internal/uekschedule"
)

func (srv *Server) handleRequestICal(w http.ResponseWriter, r *http.Request) {
	const icalTimestampFormat = "20060102T150405Z"

	payload := struct {
		AuthScheme     string                   `json:"authScheme"`
		AuthValue      string                   `json:"authValue"`
		ScheduleType   uekschedule.ScheduleType `json:"scheduleType"`
		ScheduleIds    []int                    `json:"scheduleIds"`
		PeriodIdx      int                      `json:"periodIdx"`
		HiddenSubjects []string                 `json:"hiddenSubjects"`
	}{}
	if err := json.NewDecoder(base64.NewDecoder(base64.StdEncoding, strings.NewReader(r.PathValue("payload")))).Decode(&payload); err != nil || len(payload.ScheduleIds) == 0 || len(payload.ScheduleIds) > maxSchedulesPerRequest || !payload.ScheduleType.IsValid() {
		respondBadRequest(w)
		return
	}

	basicAuthValue := srv.extractBasicAuthValue(payload.AuthScheme, payload.AuthValue)
	if basicAuthValue == "" {
		respondUnauthorized(w)
		return
	}

	aggregateSchedule, _, err := srv.uekSchedule.GetAggregateSchedule(r.Context(), uekschedule.UEKCallParams{
		BasicAuthHeaderValue: basicAuthValue,
		ForwaredForHeader:    getForwaredForWithLastHop(r),
	}, payload.ScheduleType, payload.ScheduleIds, payload.PeriodIdx)
	if err != nil {
		if errors.Is(err, uekschedule.ErrUnauthorized) {
			respondUnauthorized(w)
		} else if !errors.Is(err, context.Canceled) {
			srv.logger.Error("Failed to get aggregate schedule for ICal", slog.Group("params", slog.String("scheduleType", string(payload.ScheduleType)), slog.Any("scheduleIds", payload.ScheduleIds), slog.Int("periodIdx", payload.PeriodIdx)), slog.Any("err", err))
			respondServiceUnavailable(w)
		}
		return
	}

	calendarNameBuilder := strings.Builder{}
	calendarNameBuilder.WriteString("(UEK) ")
	for i, header := range aggregateSchedule.Headers {
		if i != 0 {
			calendarNameBuilder.WriteString(", ")
		}
		calendarNameBuilder.WriteString(header.Name)
	}
	if len(payload.HiddenSubjects) > 0 {
		calendarNameBuilder.WriteString(fmt.Sprintf(" (-%d)", len(payload.HiddenSubjects)))
	}
	calendarName := calendarNameBuilder.String()

	w.Header().Set("Content-Type", "text/calendar; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.ics\"", calendarName))

	fmt.Fprintf(w, "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//UEK-PLANZAJEC-V4\nNAME: %s\nX-WR-CALNAME: %s\n", calendarName, calendarName)
	dtStamp := time.Now().UTC().Format(icalTimestampFormat)

	for _, item := range aggregateSchedule.Items {
		if slices.Contains(payload.HiddenSubjects, item.Subject) {
			continue
		}

		fmt.Fprintf(w, "BEGIN:VEVENT\nUID:%s\nSEQUENCE:0\nDTSTAMP:%s\nDTSTART:%s\nDTEND:%s\nSUMMARY:", uuid.NewString(), dtStamp, item.Start.UTC().Format(icalTimestampFormat), item.End.UTC().Format(icalTimestampFormat))
		if item.Extra != "" {
			fmt.Fprint(w, "[!] ")
		}
		fmt.Fprintf(w, "[%s] %s\n", item.Type, item.Subject)

		fmt.Fprint(w, "DESCRIPTION:")
		if item.Extra != "" {
			fmt.Fprint(w, item.Extra, "\\n\\n")
		}
		if item.RoomUrl != "" {
			fmt.Fprint(w, item.RoomUrl, "\\n\\n")
		}

		if len(item.Lecturers) > 0 {
			for i, lecturer := range item.Lecturers {
				if i != 0 {
					fmt.Fprint(w, ", ")
				}
				fmt.Fprint(w, lecturer.Name)
				if lecturer.MoodleCourseId != 0 {
					fmt.Fprintf(w, " (https://e-uczelnia.uek.krakow.pl/course/view.php?id=%d)", lecturer.MoodleCourseId)
				}
				fmt.Fprint(w, "\\n\\n")
			}
		}

		if len(item.Groups) > 0 {
			fmt.Fprint(w, "\\n")
			for i, group := range item.Groups {
				if i != 0 {
					fmt.Fprint(w, ", ")
				}
				fmt.Fprint(w, group)
			}
		}

		fmt.Fprint(w, "\n")

		if len(item.Lecturers) > 0 {
			fmt.Fprintf(w, "ORGANIZER;CN=\"%s\":mailto:unknown@invalid.invalid\n", item.Lecturers[0].Name)
		}

		if item.RoomName != "" {
			locationName := item.RoomName
			if item.RoomUrl != "" {
				locationName = "Online"
			}

			fmt.Fprintf(w, "LOCATION:%s\n", locationName)
		}

		fmt.Fprintf(w, "CATEGORIES:%s\nEND:VEVENT\n", item.Type)
	}

	fmt.Fprintln(w, "END:VCALENDAR")
}
