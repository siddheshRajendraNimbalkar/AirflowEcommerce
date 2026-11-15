package config

import (
	"fmt"
	"os"
)

type Config struct {
	AppPort         string
	DatabaseURL     string
	AirflowBaseURL  string
	AirflowUsername string
	AirflowPassword string
}

func Load() (*Config, error) {
	cfg := &Config{
		AppPort:         os.Getenv("APP_PORT"),
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		AirflowBaseURL:  os.Getenv("AIRFLOW_BASE_URL"),
		AirflowUsername: os.Getenv("AIRFLOW_USERNAME"),
		AirflowPassword: os.Getenv("AIRFLOW_PASSWORD"),
	}

	if cfg.AppPort == "" {
		cfg.AppPort = "8081"
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	return cfg, nil
}