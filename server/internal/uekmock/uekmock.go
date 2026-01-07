package uekmock

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path"
	"slices"
	"strings"
	"time"

	"github.com/go-xmlfmt/xmlfmt"
	"github.com/szczursonn/uek-planzajec-v4-server/internal/config"
)

type Handler struct {
	cfg                     config.Mock
	passthroughRoundTripper http.RoundTripper
}

func New(cfg config.Mock, passthroughRoundTripper http.RoundTripper) *Handler {
	return &Handler{
		cfg:                     cfg,
		passthroughRoundTripper: passthroughRoundTripper,
	}
}

func (h *Handler) RoundTrip(req *http.Request) (*http.Response, error) {
	f, err := os.Open(h.getMockResponseFilePath(req.URL))
	if err != nil {
		if h.cfg.Passthrough && strings.Contains(err.Error(), "cannot find") {
			return h.passthroughRoundTripper.RoundTrip(req)
		}

		return nil, fmt.Errorf("failed to open mock file: %w", err)
	}

	if h.cfg.Delay > 0 {
		select {
		case <-req.Context().Done():
			return nil, req.Context().Err()
		case <-time.After(h.cfg.Delay):
		}
	}

	return &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{},
		Body:       f,
	}, nil
}

func (h *Handler) DownloadResponse(ctx context.Context, url string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}

	queryParams := req.URL.Query()
	queryParams.Set("xml", "")
	req.URL.RawQuery = queryParams.Encode()

	if h.cfg.DownloadCredentials != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Basic %s", base64.RawStdEncoding.EncodeToString([]byte(h.cfg.DownloadCredentials))))
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("bad status code: %d", res.StatusCode)
	}

	xmlBuff, err := io.ReadAll(res.Body)
	if err != nil {
		return "", err
	}

	os.Mkdir(h.cfg.DirectoryPath, 0644)
	filePath := h.getMockResponseFilePath(req.URL)

	return filePath, os.WriteFile(filePath, []byte(xmlfmt.FormatXML(string(xmlBuff), "", "\t")), 0644)
}

func (h *Handler) getMockResponseFilePath(u *url.URL) string {
	skibidi := []string{}
	for k, v := range u.Query() {
		values := append([]string{}, v...)
		slices.Sort(values)
		skibidi = append(skibidi, k+strings.Join(v, ""))
	}
	slices.Sort(skibidi)

	fileName := strings.NewReplacer(
		"://", "_",
		"/", "_",
		"?", "_",
		"&", "_",
		"=", "_",
		":", "_",
	).Replace(strings.Join(skibidi, "___")) + ".xml"

	return path.Join(h.cfg.DirectoryPath, fileName)
}
