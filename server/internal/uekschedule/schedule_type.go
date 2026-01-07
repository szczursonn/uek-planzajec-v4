package uekschedule

import "fmt"

type ScheduleType string

const (
	ScheduleTypeGroup    ScheduleType = "G"
	ScheduleTypeLecturer ScheduleType = "N"
	ScheduleTypeRoom     ScheduleType = "S"
)

func (st ScheduleType) IsValid() bool {
	return st == ScheduleTypeGroup || st == ScheduleTypeLecturer || st == ScheduleTypeRoom
}

func (st ScheduleType) Validate() error {
	if st.IsValid() {
		return nil
	}

	return fmt.Errorf(errPrefix+"invalid schedule type: %s", st)
}
