package service

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"github.com/google/uuid"
	"github.com/odin-platform/odin/cmd/sportsfeed/repository"
	"github.com/odin-platform/odin/internal/models"
)

// Service contains the business logic for the sports feed.
type Service struct {
	repo   *repository.Repository
	logger *slog.Logger

	// WebSocket subscriber management.
	mu          sync.RWMutex
	subscribers map[uuid.UUID]map[chan models.OddsUpdate]struct{} // eventID -> set of channels
}

// New creates a new sportsfeed service.
func New(repo *repository.Repository, logger *slog.Logger) *Service {
	return &Service{
		repo:        repo,
		logger:      logger,
		subscribers: make(map[uuid.UUID]map[chan models.OddsUpdate]struct{}),
	}
}

// ListSports returns all available sports.
func (s *Service) ListSports(ctx context.Context) ([]models.Sport, error) {
	sports, err := s.repo.GetSports(ctx)
	if err != nil {
		return nil, fmt.Errorf("list sports: %w", err)
	}
	return sports, nil
}

// ListEventsBySport returns all active events for a given sport.
func (s *Service) ListEventsBySport(ctx context.Context, sportID uuid.UUID) ([]models.Event, error) {
	eventIDs, err := s.repo.GetEventsBySport(ctx, sportID)
	if err != nil {
		return nil, fmt.Errorf("get event IDs for sport: %w", err)
	}

	events, err := s.repo.GetEventsByID(ctx, eventIDs)
	if err != nil {
		return nil, fmt.Errorf("get events by ID: %w", err)
	}

	// Strip full market details for list view.
	for i := range events {
		events[i].Markets = nil
	}

	return events, nil
}

// GetEvent returns a single event with full markets and odds.
func (s *Service) GetEvent(ctx context.Context, eventID uuid.UUID) (*models.Event, error) {
	event, err := s.repo.GetEvent(ctx, eventID)
	if err != nil {
		return nil, fmt.Errorf("get event: %w", err)
	}
	return event, nil
}

// Subscribe registers a channel to receive odds updates for a specific event.
// Returns the channel and an unsubscribe function.
func (s *Service) Subscribe(eventID uuid.UUID) (chan models.OddsUpdate, func()) {
	ch := make(chan models.OddsUpdate, 64)

	s.mu.Lock()
	if s.subscribers[eventID] == nil {
		s.subscribers[eventID] = make(map[chan models.OddsUpdate]struct{})
	}
	s.subscribers[eventID][ch] = struct{}{}
	s.mu.Unlock()

	unsubscribe := func() {
		s.mu.Lock()
		delete(s.subscribers[eventID], ch)
		if len(s.subscribers[eventID]) == 0 {
			delete(s.subscribers, eventID)
		}
		s.mu.Unlock()
		close(ch)
	}

	return ch, unsubscribe
}

// NotifyOddsUpdate pushes an odds update to all subscribers of the event.
func (s *Service) NotifyOddsUpdate(update models.OddsUpdate) {
	s.mu.RLock()
	subs := s.subscribers[update.EventID]
	s.mu.RUnlock()

	for ch := range subs {
		select {
		case ch <- update:
		default:
			// Drop if the subscriber is too slow.
			s.logger.Warn("dropping odds update for slow subscriber",
				"event_id", update.EventID,
			)
		}
	}
}
