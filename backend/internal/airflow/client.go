package airflow

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type Client struct {
	baseURL  string
	username string
	password string
	http     *http.Client
}

type DAG struct {
	DAGID          string `json:"dag_id"`
	IsPaused       bool   `json:"is_paused"`
	LastParsedTime string `json:"last_parsed_time"`
}

type DAGList struct {
	DAGs         []DAG `json:"dags"`
	TotalEntries int   `json:"total_entries"`
}

type DAGRun struct {
	DAGRunID  string     `json:"dag_run_id"`
	State     string     `json:"state"`
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
}

type DAGRunList struct {
	DAGRuns      []DAGRun `json:"dag_runs"`
	TotalEntries int      `json:"total_entries"`
}

func NewClient() *Client {
	return &Client{
		baseURL:  strings.TrimRight(os.Getenv("AIRFLOW_BASE_URL"), "/"),
		username: os.Getenv("AIRFLOW_USERNAME"),
		password: os.Getenv("AIRFLOW_PASSWORD"),
		http: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (c *Client) token(ctx context.Context) (string, error) {
	payload, err := json.Marshal(map[string]string{
		"username": c.username,
		"password": c.password,
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodPost,
		c.baseURL+"/auth/token",
		bytes.NewReader(payload),
	)
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("Airflow authentication request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return "", fmt.Errorf(
			"Airflow authentication failed (%d): %s",
			resp.StatusCode,
			string(body),
    	)
	}

	var result struct {
		AccessToken string `json:"access_token"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if result.AccessToken == "" {
		return "", fmt.Errorf("Airflow returned an empty access token")
	}

	return result.AccessToken, nil
}

func (c *Client) get(ctx context.Context, path string, target any) error {
	token, err := c.token(ctx)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(
		ctx,
		http.MethodGet,
		c.baseURL+path,
		nil,
	)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("Airflow API request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf(
			"Airflow API returned %d: %s",
			resp.StatusCode,
			string(body),
		)
	}

	return json.NewDecoder(resp.Body).Decode(target)
}

func (c *Client) ListDAGs(ctx context.Context) (*DAGList, error) {
	var result DAGList

	err := c.get(ctx, "/api/v2/dags?limit=100", &result)
	return &result, err
}

func (c *Client) ListDAGRuns(
	ctx context.Context,
	dagID string,
) (*DAGRunList, error) {
	var result DAGRunList

	path := fmt.Sprintf(
		"/api/v2/dags/%s/dagRuns?limit=10&order_by=-start_date",
		url.PathEscape(dagID),
	)

	err := c.get(ctx, path, &result)
	return &result, err
}
