package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/odin-platform/odin/internal/models"
	odinredis "github.com/odin-platform/odin/internal/redis"
	"github.com/redis/go-redis/v9"
)

const (
	// Key patterns for Redis storage.
	keyEventPrefix     = "odds:event:"       // odds:event:{event_id} -> full event JSON
	keySportEventsPrefix = "odds:sport:"     // odds:sport:{sport_id}:events -> set of event IDs
	keySelectionPrefix = "odds:selection:"    // odds:selection:{selection_id} -> odds value
	keySports          = "odds:sports"        // odds:sports -> list of all sports JSON
	keyAllEvents       = "odds:events:active" // set of all active event IDs

	eventTTL     = 60 * time.Second
	sportEventsTTL = 30 * time.Second
	selectionTTL = 60 * time.Second
	sportsTTL    = 5 * time.Minute
)

// Repository handles Redis-based storage for sports feed data.
type Repository struct {
	redis *odinredis.Client
}

// New creates a new sportsfeed repository.
func New(client *odinredis.Client) *Repository {
	return &Repository{redis: client}
}

// GetSports returns all available sports.
func (r *Repository) GetSports(ctx context.Context) ([]models.Sport, error) {
	data, err := r.redis.Get(ctx, keySports).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get sports: %w", err)
	}

	var sports []models.Sport
	if err := json.Unmarshal(data, &sports); err != nil {
		return nil, fmt.Errorf("unmarshal sports: %w", err)
	}
	return sports, nil
}

// SetSports stores the list of all sports.
func (r *Repository) SetSports(ctx context.Context, sports []models.Sport) error {
	data, err := json.Marshal(sports)
	if err != nil {
		return fmt.Errorf("marshal sports: %w", err)
	}
	return r.redis.Set(ctx, keySports, data, sportsTTL).Err()
}

// GetEventsByID returns events for the given event IDs.
func (r *Repository) GetEventsByID(ctx context.Context, eventIDs []string) ([]models.Event, error) {
	if len(eventIDs) == 0 {
		return nil, nil
	}

	pipe := r.redis.Pipeline()
	cmds := make([]*redis.StringCmd, len(eventIDs))
	for i, id := range eventIDs {
		cmds[i] = pipe.Get(ctx, keyEventPrefix+id)
	}

	_, err := pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		return nil, fmt.Errorf("pipeline get events: %w", err)
	}

	var events []models.Event
	for _, cmd := range cmds {
		data, err := cmd.Bytes()
		if err == redis.Nil {
			continue
		}
		if err != nil {
			continue
		}
		var event models.Event
		if err := json.Unmarshal(data, &event); err != nil {
			continue
		}
		events = append(events, event)
	}

	return events, nil
}

// GetEventsBySport returns active event IDs for a sport.
func (r *Repository) GetEventsBySport(ctx context.Context, sportID uuid.UUID) ([]string, error) {
	key := keySportEventsPrefix + sportID.String() + ":events"
	ids, err := r.redis.SMembers(ctx, key).Result()
	if err != nil {
		return nil, fmt.Errorf("get sport events: %w", err)
	}
	return ids, nil
}

// GetEvent returns a single event by ID with all markets and selections.
func (r *Repository) GetEvent(ctx context.Context, eventID uuid.UUID) (*models.Event, error) {
	data, err := r.redis.Get(ctx, keyEventPrefix+eventID.String()).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get event: %w", err)
	}

	var event models.Event
	if err := json.Unmarshal(data, &event); err != nil {
		return nil, fmt.Errorf("unmarshal event: %w", err)
	}
	return &event, nil
}

// SetEvent stores a full event (with markets and selections) in Redis.
func (r *Repository) SetEvent(ctx context.Context, event models.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}

	pipe := r.redis.Pipeline()

	// Store the full event.
	pipe.Set(ctx, keyEventPrefix+event.ID.String(), data, eventTTL)

	// Add to sport's event set.
	sportKey := keySportEventsPrefix + event.SportID.String() + ":events"
	pipe.SAdd(ctx, sportKey, event.ID.String())
	pipe.Expire(ctx, sportKey, sportEventsTTL)

	// Add to active events set.
	pipe.SAdd(ctx, keyAllEvents, event.ID.String())

	// Store individual selection odds.
	for _, market := range event.Markets {
		for _, sel := range market.Selections {
			selData, _ := json.Marshal(sel.Odds)
			pipe.Set(ctx, keySelectionPrefix+sel.ID.String(), selData, selectionTTL)
		}
	}

	_, err = pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("set event pipeline: %w", err)
	}

	return nil
}

// GetSelectionOdds returns the current odds for a single selection.
func (r *Repository) GetSelectionOdds(ctx context.Context, selectionID uuid.UUID) (float64, error) {
	val, err := r.redis.Get(ctx, keySelectionPrefix+selectionID.String()).Float64()
	if err == redis.Nil {
		return 0, fmt.Errorf("selection not found")
	}
	if err != nil {
		return 0, fmt.Errorf("get selection odds: %w", err)
	}
	return val, nil
}

// GetAllActiveEventIDs returns all active event IDs.
func (r *Repository) GetAllActiveEventIDs(ctx context.Context) ([]string, error) {
	ids, err := r.redis.SMembers(ctx, keyAllEvents).Result()
	if err != nil {
		return nil, fmt.Errorf("get all active events: %w", err)
	}
	return ids, nil
}
