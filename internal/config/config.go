package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

// Config holds all common configuration fields shared across services.
type Config struct {
	// Service identification
	ServiceName string `mapstructure:"SERVICE_NAME"`
	Env         string `mapstructure:"ENV"`
	Port        int    `mapstructure:"PORT"`

	// Data stores
	DatabaseURL string `mapstructure:"DATABASE_URL"`
	RedisURL    string `mapstructure:"REDIS_URL"`

	// Kafka
	KafkaBrokers string `mapstructure:"KAFKA_BROKERS"`
	KafkaBroker  string `mapstructure:"KAFKA_BROKER"` // backward compat, single broker

	// Auth
	JWTSecret          string `mapstructure:"JWT_SECRET"`
	AuthPrivateKeyPath string `mapstructure:"AUTH_PRIVATE_KEY_PATH"`
	AuthPublicKeyPath  string `mapstructure:"AUTH_PUBLIC_KEY_PATH"`
	JWTPrivateKeyPath  string `mapstructure:"JWT_PRIVATE_KEY_PATH"` // backward compat alias
	JWTPublicKeyPath   string `mapstructure:"JWT_PUBLIC_KEY_PATH"`  // backward compat alias

	// Internal service auth
	InternalAuthToken string `mapstructure:"INTERNAL_AUTH_TOKEN"`

	// Service URLs for inter-service communication
	WalletServiceURL string `mapstructure:"WALLET_SERVICE_URL"`
}

// KafkaBrokerList returns the configured brokers as a string slice.
func (c *Config) KafkaBrokerList() []string {
	if c.KafkaBrokers == "" {
		return nil
	}
	brokers := strings.Split(c.KafkaBrokers, ",")
	for i := range brokers {
		brokers[i] = strings.TrimSpace(brokers[i])
	}
	return brokers
}

// Load reads configuration from environment variables (and an optional .env
// file in the working directory). It sets sensible defaults for local
// development.
func Load() (*Config, error) {
	viper.AutomaticEnv()

	// Optionally load a .env file if present (ignored if missing).
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	_ = viper.ReadInConfig()

	// Defaults for local development.
	viper.SetDefault("SERVICE_NAME", "odin-service")
	viper.SetDefault("ENV", "development")
	viper.SetDefault("PORT", 8080)
	viper.SetDefault("DATABASE_URL", "postgres://odin:odin@localhost:5432/odin?sslmode=disable")
	viper.SetDefault("REDIS_URL", "redis://localhost:6379/0")
	viper.SetDefault("KAFKA_BROKERS", "localhost:9092")
	viper.SetDefault("KAFKA_BROKER", "localhost:9092")
	viper.SetDefault("AUTH_PRIVATE_KEY_PATH", "/etc/odin/keys/private.pem")
	viper.SetDefault("AUTH_PUBLIC_KEY_PATH", "/etc/odin/keys/public.pem")
	viper.SetDefault("JWT_PRIVATE_KEY_PATH", "/etc/odin/keys/private.pem")
	viper.SetDefault("JWT_PUBLIC_KEY_PATH", "/etc/odin/keys/public.pem")
	viper.SetDefault("INTERNAL_AUTH_TOKEN", "")
	viper.SetDefault("WALLET_SERVICE_URL", "http://localhost:8002")

	cfg := &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, fmt.Errorf("config: unmarshal: %w", err)
	}

	return cfg, nil
}
