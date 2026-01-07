package uekschedule

import (
	"context"
	"strings"
)

type Grouping struct {
	Name string       `json:"name"`
	Type ScheduleType `json:"type"`
}

func (c *Client) GetGroupings(ctx context.Context, callParams UEKCallParams) ([]Grouping, error) {
	const groupingsUrl = baseUrl + "?xml"
	res, err := c.callUEK(ctx, callParams, groupingsUrl)
	if err != nil {
		return nil, err
	}

	return res.extractGroupings(), nil
}

func (res *responseBody) extractGroupings() []Grouping {
	groupings := make([]Grouping, 0, len(res.Grupowanie))
	for _, originalGrouping := range res.Grupowanie {
		if !originalGrouping.Typ.IsValid() {
			continue
		}

		groupingName := strings.TrimSpace(originalGrouping.Grupa)
		if groupingName == "" {
			continue
		}

		groupings = append(groupings, Grouping{
			Name: groupingName,
			Type: originalGrouping.Typ,
		})
	}

	return groupings
}
