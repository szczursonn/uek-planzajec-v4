package uekschedule

import (
	"context"
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

type ScheduleHeader struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

func (c *Client) GetHeaders(ctx context.Context, callParams UEKCallParams, scheduleType ScheduleType, groupingName string) ([]ScheduleHeader, error) {
	res, err := c.callUEK(ctx, callParams, fmt.Sprintf("%s?typ=%s&grupa=%s&xml", baseUrl, scheduleType, url.QueryEscape(groupingName)))
	if err != nil {
		return nil, err
	}

	return res.extractHeaders(scheduleType), nil
}

func (res *responseBody) extractHeaders(requestedScheduleType ScheduleType) []ScheduleHeader {
	headers := make([]ScheduleHeader, 0, len(res.Zasob))

	for _, originalHeader := range res.Zasob {
		if originalHeader.Typ != requestedScheduleType {
			continue
		}

		headerName := strings.TrimSpace(originalHeader.Nazwa)
		if headerName == "" {
			continue
		}

		headerId, err := strconv.Atoi(originalHeader.Id)
		if err != nil {
			continue
		}

		headers = append(headers, ScheduleHeader{
			Id:   headerId,
			Name: headerName,
		})
	}

	return headers
}
