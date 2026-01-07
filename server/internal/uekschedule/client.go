package uekschedule

import (
	"context"
	"encoding/xml"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/szczursonn/uek-planzajec-v4-server/internal/config"
)

const baseUrl = "https://planzajec.uek.krakow.pl/index.php"

type Client struct {
	httpClient                     *http.Client
	logger                         *slog.Logger
	cfg                            config.UEK
	maxConcurrentRequestsSemaphore chan struct{}
	location                       *time.Location
}

func NewClient(httpClient *http.Client, logger *slog.Logger, cfg config.UEK) (*Client, error) {
	if cfg.MaxConcurrentRequests < 1 {
		return nil, fmt.Errorf(errPrefix + "max concurrent requests should be greater than 0")
	}

	loc, err := time.LoadLocation("Europe/Warsaw")
	if err != nil {
		return nil, fmt.Errorf(errPrefix+"failed to load timezone data: %w", err)
	}

	return &Client{
		httpClient:                     httpClient,
		cfg:                            cfg,
		logger:                         logger,
		maxConcurrentRequestsSemaphore: make(chan struct{}, cfg.MaxConcurrentRequests),
		location:                       loc,
	}, nil
}

type responseBody struct {
	XMLName xml.Name     `xml:"plan-zajec"`
	Typ     ScheduleType `xml:"typ,attr"`
	Id      string       `xml:"id,attr"`
	Idcel   string       `xml:"idcel,attr"`
	Nazwa   string       `xml:"nazwa,attr"`
	Okres   []struct {
		Od string `xml:"od,attr"`
		Do string `xml:"do,attr"`
	} `xml:"okres"`
	Grupowanie []struct {
		Typ   ScheduleType `xml:"typ,attr"`
		Grupa string       `xml:"grupa,attr"`
	} `xml:"grupowanie"`
	Zasob []struct {
		Typ   ScheduleType `xml:"typ,attr"`
		Id    string       `xml:"id,attr"`
		Nazwa string       `xml:"nazwa,attr"`
	} `xml:"zasob"`
	Zajecia []struct {
		Termin     string `xml:"termin"`
		OdGodz     string `xml:"od-godz"`
		DoGodz     string `xml:"do-godz"`
		Przedmiot  string `xml:"przedmiot"`
		Typ        string `xml:"typ"`
		Nauczyciel []struct {
			Moodle string `xml:"moodle,attr"`
			Nazwa  string `xml:",chardata"`
		} `xml:"nauczyciel"`
		Sala  string `xml:"sala"`
		Grupa string `xml:"grupa"`
		Uwagi string `xml:"uwagi"`
	} `xml:"zajecia"`
}

type UEKCallParams struct {
	BasicAuthHeaderValue string
	ForwaredForHeader    string
}

func (c *Client) callUEK(ctx context.Context, callParams UEKCallParams, targetUrl string) (*responseBody, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, targetUrl, nil)
	if err != nil {
		return nil, fmt.Errorf(errPrefix+"failed to create request: %w", err)
	}

	if callParams.BasicAuthHeaderValue != "" {
		req.Header.Set("Authorization", "Basic "+callParams.BasicAuthHeaderValue)
	}
	if callParams.ForwaredForHeader != "" {
		req.Header.Set("X-Forwarded-For", callParams.ForwaredForHeader)
	}
	if c.cfg.UserAgent != "" {
		req.Header.Set("User-Agent", c.cfg.UserAgent)
	}
	req.Header.Set("Content-Type", "application/xml")

	c.maxConcurrentRequestsSemaphore <- struct{}{}
	defer func() {
		<-c.maxConcurrentRequestsSemaphore
	}()

	c.logger.Debug("Calling UEK", slog.String("url", req.URL.String()), slog.String("forwardedFor", callParams.ForwaredForHeader))
	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf(errPrefix+"failed to do request: %w", err)
	}
	defer res.Body.Close()

	switch res.StatusCode {
	case http.StatusOK:
		break
	case http.StatusUnauthorized:
		return nil, ErrUnauthorized
	default:
		return nil, fmt.Errorf(errPrefix+"unexpected status code: %d", res.StatusCode)
	}

	resBody := &responseBody{}
	if err = xml.NewDecoder(res.Body).Decode(resBody); err != nil {
		return nil, fmt.Errorf(errPrefix+"failed to decode xml response: %w", err)
	}

	return resBody, nil
}
