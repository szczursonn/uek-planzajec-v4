package uekschedule

import (
	"fmt"
	"time"
)

type SchedulePeriod struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

func (res *responseBody) extractPeriods(loc *time.Location) ([]SchedulePeriod, error) {
	periods := make([]SchedulePeriod, 0, len(res.Okres))

	for i, originalPeriod := range res.Okres {
		start, err := time.ParseInLocation("2006-01-02 15:04", fmt.Sprintf("%s 00:00", originalPeriod.Od), loc)
		if err != nil {
			return nil, fmt.Errorf(errPrefix+"failed to parse period start date at index %d: %w", i, err)
		}

		end, err := time.ParseInLocation("2006-01-02 15:04", fmt.Sprintf("%s 23:59", originalPeriod.Do), loc)
		if err != nil {
			return nil, fmt.Errorf(errPrefix+"failed to parse period end date at index %d: %w", i, err)
		}

		periods = append(periods, SchedulePeriod{
			Start: start,
			End:   end,
		})
	}

	return periods, nil
}
