package uekschedule

import (
	"context"
	"slices"

	"golang.org/x/sync/errgroup"
)

type AggregateSchedule struct {
	Headers []ScheduleHeader `json:"headers"`
	Items   []*ScheduleItem  `json:"items"`
}

func (c *Client) GetAggregateSchedule(ctx context.Context, callParams UEKCallParams, scheduleType ScheduleType, scheduleIds []int, periodIdx int) (*AggregateSchedule, []SchedulePeriod, error) {
	singleSchedules := make([]*Schedule, len(scheduleIds))
	var periods []SchedulePeriod

	eg, egCtx := errgroup.WithContext(ctx)
	for i, scheduleId := range scheduleIds {
		eg.Go(func() error {
			schedule, p, err := c.GetSchedule(egCtx, callParams, scheduleType, scheduleId, periodIdx)
			if err != nil {
				return err
			}

			singleSchedules[i] = schedule
			if i == 0 {
				periods = p
			}

			return nil
		})
	}

	if err := eg.Wait(); err != nil {
		return nil, nil, err
	}

	return mergeSchedules(singleSchedules), periods, nil
}

// sorted lists merge + deduping without additional sorting
func mergeSchedules(singleSchedules []*Schedule) *AggregateSchedule {
	headers := make([]ScheduleHeader, 0, len(singleSchedules))
	totalItemCount := 0
	for _, schedule := range singleSchedules {
		headers = append(headers, schedule.Header)
		totalItemCount += len(schedule.Items)
	}

	items := make([]*ScheduleItem, 0, totalItemCount)
	currentItemIndexesBySchedule := make([]int, len(singleSchedules))
	for {
		var nextItem *ScheduleItem
		var nextItemScheduleIndex int

		for scheduleIndex, currentItemIndex := range currentItemIndexesBySchedule {
			scheduleItems := singleSchedules[scheduleIndex].Items
			if currentItemIndex == len(scheduleItems) {
				continue
			}

			nextItemForCurrentSchedule := scheduleItems[currentItemIndex]
			if nextItem == nil || nextItem.Compare(nextItemForCurrentSchedule) == 1 {
				nextItem = nextItemForCurrentSchedule
				nextItemScheduleIndex = scheduleIndex
			}
		}

		if nextItem == nil {
			break
		}
		currentItemIndexesBySchedule[nextItemScheduleIndex]++

		previousItemIndex := len(items) - 1
		if previousItemIndex > -1 && nextItem.EqualIgnoringGroups(items[previousItemIndex]) {
			mergedItem := items[previousItemIndex].ShallowCopy()
			mergedItem.Groups = append(make([]string, 0, len(mergedItem.Groups)+len(nextItem.Groups)), mergedItem.Groups...)
			for _, nextItemGroup := range nextItem.Groups {
				if !slices.Contains(mergedItem.Groups, nextItemGroup) {
					mergedItem.Groups = append(mergedItem.Groups, nextItemGroup)
				}
			}
			items[previousItemIndex] = mergedItem
		} else {
			items = append(items, nextItem)
		}
	}

	return &AggregateSchedule{
		Headers: headers,
		Items:   items,
	}
}

func (a *ScheduleItem) EqualIgnoringGroups(b *ScheduleItem) bool {
	if !a.Start.Equal(b.Start) || !a.End.Equal(b.End) || a.Subject != b.Subject || a.Type != b.Type || a.Extra != b.Extra || len(a.Lecturers) != len(b.Lecturers) {
		return false
	}

	for i := range len(a.Lecturers) {
		if a.Lecturers[i].Name != b.Lecturers[i].Name || a.Lecturers[i].MoodleCourseId != b.Lecturers[i].MoodleCourseId {
			return false
		}
	}

	if a.RoomName != b.RoomName || a.RoomUrl != b.RoomUrl {
		return false
	}

	return true
}

func (item *ScheduleItem) ShallowCopy() *ScheduleItem {
	return &ScheduleItem{
		Start:     item.Start,
		End:       item.End,
		Subject:   item.Subject,
		Type:      item.Type,
		Groups:    item.Groups,
		Lecturers: item.Lecturers,
		RoomName:  item.RoomName,
		RoomUrl:   item.RoomUrl,
		Extra:     item.Extra,
	}
}
