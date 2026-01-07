package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Debug  bool
	Server Server
	UEK    UEK
	Mock   Mock
}

type Server struct {
	Addr          string
	EncryptionKey string
}

type UEK struct {
	UserAgent             string
	MaxConcurrentRequests int
}

type Mock struct {
	Enabled             bool
	Passthrough         bool
	Delay               time.Duration
	DirectoryPath       string
	DownloadCredentials string
}

func FromEnv() Config {
	const serverEnvPrefix = "SERVER_"
	const uekEnvPrefix = "UEK_"
	const mockEnvPrefix = "MOCK_"

	return Config{
		Debug: getEnvBoolWithDefault("DEBUG", false),
		Server: Server{
			Addr:          getEnvStringWithDefault(serverEnvPrefix+"ADDR", ":3001"),
			EncryptionKey: getEnvString(serverEnvPrefix + "ENCRYPTION_KEY"),
		},
		UEK: UEK{
			UserAgent:             getEnvString(uekEnvPrefix + "USER_AGENT"),
			MaxConcurrentRequests: getEnvIntWithDefault(uekEnvPrefix+"MAX_CONCURRENT_REQUESTS", 1),
		},
		Mock: Mock{
			Enabled:             getEnvBoolWithDefault(mockEnvPrefix+"ENABLED", false),
			Passthrough:         getEnvBoolWithDefault(mockEnvPrefix+"PASSTHROUGH", false),
			Delay:               getEnvDurationWithDefault(mockEnvPrefix+"DELAY", time.Second),
			DirectoryPath:       getEnvStringWithDefault(mockEnvPrefix+"DIR", "./mock"),
			DownloadCredentials: getEnvString(mockEnvPrefix + "DOWNLOAD_CREDENTIALS"),
		},
	}
}

func getEnvString(key string) string {
	const envPrefix = "UEKPZ4_"
	return strings.TrimSpace(os.Getenv(envPrefix + key))
}

func getEnvStringWithDefault(key string, defaultValue string) string {
	value := getEnvString(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getEnvBoolWithDefault(key string, defaultValue bool) bool {
	value, err := strconv.ParseBool(getEnvString(key))
	if err != nil {
		return defaultValue
	}
	return value
}

func getEnvIntWithDefault(key string, defaultValue int) int {
	n, err := strconv.Atoi(getEnvString(key))
	if err != nil {
		return defaultValue
	}
	return n
}

func getEnvDurationWithDefault(key string, defaultValue time.Duration) time.Duration {
	value, err := time.ParseDuration(getEnvString(key))
	if err != nil {
		return defaultValue
	}

	return max(value, 0)
}
