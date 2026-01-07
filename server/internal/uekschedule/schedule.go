package uekschedule

import (
	"context"
	"fmt"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"time"
)

type Schedule struct {
	Header ScheduleHeader  `json:"header"`
	Items  []*ScheduleItem `json:"items"`
}

type ScheduleItem struct {
	Start     time.Time              `json:"start"`
	End       time.Time              `json:"end"`
	Subject   string                 `json:"subject"`
	Type      string                 `json:"type"`
	Groups    []string               `json:"groups,omitempty"`
	Lecturers []ScheduleItemLecturer `json:"lecturers,omitempty"`
	RoomName  string                 `json:"roomName,omitempty"`
	RoomUrl   string                 `json:"roomUrl,omitempty"`
	Extra     string                 `json:"extra,omitempty"`
}

type ScheduleItemLecturer struct {
	Name           string `json:"name"`
	MoodleCourseId int    `json:"moodleCourseId,omitempty"`
}

func (a *ScheduleItem) Compare(b *ScheduleItem) int {
	startCompareResult := a.Start.Compare(b.Start)
	if startCompareResult != 0 {
		return startCompareResult
	}

	endCompareResult := a.End.Compare(b.End)
	if endCompareResult != 0 {
		return endCompareResult
	}

	subjectCompareResult := strings.Compare(a.Subject, b.Subject)
	if subjectCompareResult != 0 {
		return subjectCompareResult
	}

	return strings.Compare(a.Type, b.Type)
}

func (c *Client) GetSchedule(ctx context.Context, callParams UEKCallParams, scheduleType ScheduleType, scheduleId int, periodIdx int) (*Schedule, []SchedulePeriod, error) {
	res, err := c.callUEK(ctx, callParams, fmt.Sprintf("%s?typ=%s&id=%d&okres=%d&xml", baseUrl, scheduleType, scheduleId, periodIdx+1))
	if err != nil {
		return nil, nil, err
	}

	schedule, periods, err := res.extractSchedule(scheduleType, scheduleId, c.location)
	if err != nil {
		return nil, nil, err
	}

	return schedule, periods, nil
}

var scheduleItemRoomLinkRegex = regexp.MustCompile(`^<a href="(.+)">(.+)<\/a>$`)

func (res *responseBody) extractSchedule(requestedScheduleType ScheduleType, requestedScheduleId int, loc *time.Location) (*Schedule, []SchedulePeriod, error) {
	if res.Typ != requestedScheduleType {
		return nil, nil, fmt.Errorf(errPrefix+"received different schedule type than requested: %s", res.Typ)
	}

	receivedScheduleId, err := strconv.Atoi(res.Id)
	if err != nil {
		return nil, nil, fmt.Errorf(errPrefix+"cannot parse schedule id as number: %w", err)
	}

	if receivedScheduleId != requestedScheduleId {
		return nil, nil, fmt.Errorf(errPrefix+"received different schedule id than requested: %d", receivedScheduleId)
	}

	scheduleName := strings.TrimSpace(res.Nazwa)
	if scheduleName == "" {
		return nil, nil, fmt.Errorf(errPrefix + "missing schedule name")
	}

	groupsFromSchedule := []string{scheduleName}
	lecturersFromSchedule := []ScheduleItemLecturer{
		{
			Name: scheduleName,
		},
	}

	if scheduleMoodleCourseIdRaw := strings.TrimSpace(res.Idcel); scheduleMoodleCourseIdRaw != "" {
		if lecturersFromSchedule[0].MoodleCourseId, err = parseMoodleId(scheduleMoodleCourseIdRaw); err != nil {
			return nil, nil, fmt.Errorf(errPrefix+"%w", err)
		}
	}

	items := make([]*ScheduleItem, 0, len(res.Zajecia))
	for i, resItem := range res.Zajecia {
		if err := func() error {
			item := &ScheduleItem{
				Type:    strings.ToLower(strings.TrimSpace(resItem.Typ)),
				Subject: strings.TrimSpace(resItem.Przedmiot),
				Extra:   strings.TrimSpace(resItem.Uwagi),
			}

			// remove language slots, who cares
			if item.Type == "lektorat" && strings.HasSuffix(item.Subject, "grupa przedmiotów") {
				return nil
			}

			item.Start, err = parseScheduleDate(resItem.Termin+" "+resItem.OdGodz, loc)
			if err != nil {
				return fmt.Errorf("failed to parse item end date: %w", err)
			}

			item.End, err = parseScheduleDate(resItem.Termin+" "+strings.Split(resItem.DoGodz, " ")[0], loc)
			if err != nil {
				return fmt.Errorf("failed to parse item end date: %w", err)
			}

			if item.Start.After(item.End) {
				return fmt.Errorf("start time is after end time")
			}

			if res.Typ == ScheduleTypeGroup {
				item.Groups = groupsFromSchedule
			} else {
				item.Groups = make([]string, 0, 1)
				for _, group := range strings.Split(resItem.Grupa, ",") {
					group = strings.TrimSpace(group)
					if group == "" {
						continue
					}

					item.Groups = append(item.Groups, group)
				}
			}

			if res.Typ == ScheduleTypeLecturer {
				item.Lecturers = lecturersFromSchedule
			} else {
				item.Lecturers = make([]ScheduleItemLecturer, 0, len(resItem.Nauczyciel))
				for j, resItemLecturer := range resItem.Nauczyciel {
					lecturerName := strings.TrimSpace(resItemLecturer.Nazwa)
					if lecturerName == "" {
						continue
					}

					lecturerMoodleCourseId := 0
					if lecturerMoodleCourseIdRaw := strings.TrimSpace(resItemLecturer.Moodle); lecturerMoodleCourseIdRaw != "" {
						if lecturerMoodleCourseId, err = parseMoodleId(lecturerMoodleCourseIdRaw); err != nil {
							return fmt.Errorf("%w at lecturer index %d", err, j)
						}
					}

					item.Lecturers = append(item.Lecturers, ScheduleItemLecturer{
						Name:           lecturerName,
						MoodleCourseId: lecturerMoodleCourseId,
					})
				}
			}

			if res.Typ == ScheduleTypeRoom {
				item.RoomName = scheduleName
			} else if roomName := strings.TrimSpace(resItem.Sala); roomName != "" {
				if matches := scheduleItemRoomLinkRegex.FindStringSubmatch(roomName); len(matches) > 0 {
					item.RoomName = matches[2]
					item.RoomUrl = matches[1]
				} else {
					item.RoomName = roomName
				}
			}

			items = append(items, item)
			return nil
		}(); err != nil {
			return nil, nil, fmt.Errorf(errPrefix+"%w at item index %d", err, i)
		}
	}

	slices.SortFunc(items, func(a *ScheduleItem, b *ScheduleItem) int {
		return a.Compare(b)
	})

	periods, err := res.extractPeriods(loc)
	if err != nil {
		return nil, nil, err
	}

	return &Schedule{
		Header: ScheduleHeader{
			Id:   receivedScheduleId,
			Name: scheduleName,
		},
		Items: items,
	}, periods, nil
}

func parseMoodleId(moodleIdStr string) (int, error) {
	moodleIdStr, _ = strings.CutPrefix(moodleIdStr, "-")

	moodleId, err := strconv.Atoi(moodleIdStr)
	if err != nil {
		return 0, fmt.Errorf("cannot convert moodle id to number: %w", err)
	}

	return moodleId, nil
}

func parseScheduleDate(input string, loc *time.Location) (time.Time, error) {
	return time.ParseInLocation("2006-01-02 15:04", input, loc)
}
