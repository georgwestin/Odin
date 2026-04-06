package feed

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"github.com/odin-platform/odin/cmd/sportsfeed/repository"
	"github.com/odin-platform/odin/internal/kafka"
	"github.com/odin-platform/odin/internal/models"
)

// Simulator generates realistic sports events with evolving odds for development.
type Simulator struct {
	repo     *repository.Repository
	producer *kafka.Producer
	logger   *slog.Logger
	rng      *rand.Rand

	sports []models.Sport
	events []models.Event
}

// NewSimulator creates a new feed simulator.
func NewSimulator(repo *repository.Repository, producer *kafka.Producer, logger *slog.Logger) *Simulator {
	return &Simulator{
		repo:     repo,
		producer: producer,
		logger:   logger,
		rng:      rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// Run starts the simulator, generating events and updating odds periodically.
func (s *Simulator) Run(ctx context.Context) {
	s.logger.Info("feed simulator starting")

	s.initSports(ctx)
	s.initEvents(ctx)

	oddsUpdate := time.NewTicker(3 * time.Second)
	defer oddsUpdate.Stop()

	resultTicker := time.NewTicker(2 * time.Minute)
	defer resultTicker.Stop()

	newEventTicker := time.NewTicker(30 * time.Second)
	defer newEventTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			s.logger.Info("feed simulator stopped")
			return

		case <-oddsUpdate.C:
			s.updateOdds(ctx)

		case <-resultTicker.C:
			s.resultRandomEvent(ctx)

		case <-newEventTicker.C:
			s.addNewEvent(ctx)
		}
	}
}

func (s *Simulator) initSports(ctx context.Context) {
	s.sports = []models.Sport{
		{ID: uuidFromSeed("football"), Name: "Football", Slug: "football", IsActive: true, Order: 1},
		{ID: uuidFromSeed("basketball"), Name: "Basketball", Slug: "basketball", IsActive: true, Order: 2},
		{ID: uuidFromSeed("tennis"), Name: "Tennis", Slug: "tennis", IsActive: true, Order: 3},
		{ID: uuidFromSeed("ice-hockey"), Name: "Ice Hockey", Slug: "ice-hockey", IsActive: true, Order: 4},
		{ID: uuidFromSeed("esports"), Name: "Esports", Slug: "esports", IsActive: true, Order: 5},
	}

	if err := s.repo.SetSports(ctx, s.sports); err != nil {
		s.logger.Error("failed to set sports", "error", err)
	}
}

func (s *Simulator) initEvents(ctx context.Context) {
	teams := map[string][][2]string{
		"football": {
			{"Manchester United", "Liverpool"},
			{"Real Madrid", "Barcelona"},
			{"Bayern Munich", "Borussia Dortmund"},
			{"Juventus", "AC Milan"},
			{"PSG", "Marseille"},
		},
		"basketball": {
			{"LA Lakers", "Boston Celtics"},
			{"Golden State Warriors", "Brooklyn Nets"},
			{"Milwaukee Bucks", "Phoenix Suns"},
		},
		"tennis": {
			{"Djokovic", "Nadal"},
			{"Alcaraz", "Sinner"},
			{"Medvedev", "Zverev"},
		},
		"ice-hockey": {
			{"Tampa Bay Lightning", "Colorado Avalanche"},
			{"Edmonton Oilers", "Florida Panthers"},
		},
		"esports": {
			{"T1", "Gen.G"},
			{"Fnatic", "G2 Esports"},
		},
	}

	for _, sport := range s.sports {
		matchups, ok := teams[sport.Slug]
		if !ok {
			continue
		}
		for _, matchup := range matchups {
			event := s.generateEvent(sport, matchup[0], matchup[1])
			s.events = append(s.events, event)
			if err := s.repo.SetEvent(ctx, event); err != nil {
				s.logger.Error("failed to set event", "error", err, "event", event.Name)
			}
		}
	}

	s.logger.Info("initialized events", "count", len(s.events))
}

func (s *Simulator) generateEvent(sport models.Sport, home, away string) models.Event {
	eventID := uuid.New()
	now := time.Now().UTC()

	// Random start time: some in the past (live), some in the future (prematch).
	offset := time.Duration(s.rng.Intn(120)-30) * time.Minute
	startsAt := now.Add(offset)

	status := "prematch"
	if startsAt.Before(now) {
		status = "live"
	}

	var score *models.Score
	if status == "live" {
		score = &models.Score{
			Home: s.rng.Intn(4),
			Away: s.rng.Intn(4),
		}
	}

	// Generate match winner market.
	matchWinnerID := uuid.New()
	homeOdds := s.randomOdds(1.2, 5.0)
	drawOdds := s.randomOdds(2.5, 5.0)
	awayOdds := s.randomOdds(1.2, 5.0)

	matchWinner := models.Market{
		ID:      matchWinnerID,
		EventID: eventID,
		Name:    "Match Winner",
		Type:    "match_winner",
		Status:  "open",
		Selections: []models.Selection{
			{ID: uuid.New(), MarketID: matchWinnerID, Name: home, Odds: homeOdds, Status: "active"},
			{ID: uuid.New(), MarketID: matchWinnerID, Name: "Draw", Odds: drawOdds, Status: "active"},
			{ID: uuid.New(), MarketID: matchWinnerID, Name: away, Odds: awayOdds, Status: "active"},
		},
	}

	// Generate over/under market.
	overUnderID := uuid.New()
	overOdds := s.randomOdds(1.5, 3.0)
	underOdds := s.randomOdds(1.5, 3.0)

	overUnder := models.Market{
		ID:      overUnderID,
		EventID: eventID,
		Name:    "Over/Under 2.5",
		Type:    "over_under",
		Status:  "open",
		Selections: []models.Selection{
			{ID: uuid.New(), MarketID: overUnderID, Name: "Over 2.5", Odds: overOdds, Status: "active"},
			{ID: uuid.New(), MarketID: overUnderID, Name: "Under 2.5", Odds: underOdds, Status: "active"},
		},
	}

	return models.Event{
		ID:        eventID,
		SportID:   sport.ID,
		SportName: sport.Name,
		Name:      fmt.Sprintf("%s vs %s", home, away),
		HomeTeam:  home,
		AwayTeam:  away,
		StartsAt:  startsAt,
		Status:    status,
		Score:     score,
		Markets:   []models.Market{matchWinner, overUnder},
		CreatedAt: now,
		UpdatedAt: now,
	}
}

func (s *Simulator) updateOdds(ctx context.Context) {
	for i := range s.events {
		event := &s.events[i]
		if event.Status != "live" && event.Status != "prematch" {
			continue
		}

		// Promote prematch events that should now be live.
		if event.Status == "prematch" && event.StartsAt.Before(time.Now().UTC()) {
			event.Status = "live"
			event.Score = &models.Score{Home: 0, Away: 0}
		}

		// Randomly update odds on 1-2 selections per event.
		for mi := range event.Markets {
			market := &event.Markets[mi]
			if market.Status != "open" {
				continue
			}

			for si := range market.Selections {
				if s.rng.Float64() > 0.3 {
					continue // Only update ~30% of selections each tick.
				}

				sel := &market.Selections[si]
				oldOdds := sel.Odds
				drift := (s.rng.Float64() - 0.5) * 0.2 // +/- 10%
				newOdds := math.Max(1.01, sel.Odds*(1+drift))
				newOdds = math.Round(newOdds*100) / 100
				sel.Odds = newOdds

				update := models.OddsUpdate{
					EventID:     event.ID,
					MarketID:    market.ID,
					SelectionID: sel.ID,
					OldOdds:     oldOdds,
					NewOdds:     newOdds,
					Timestamp:   time.Now().UTC(),
				}

				// Publish to Kafka.
				data, _ := json.Marshal(update)
				if s.producer != nil {
					_ = s.producer.Publish(ctx, kafka.TopicOddsUpdated, []byte(event.ID.String()), data)
				}
			}
		}

		// Randomly update live scores.
		if event.Status == "live" && event.Score != nil && s.rng.Float64() < 0.02 {
			if s.rng.Float64() < 0.5 {
				event.Score.Home++
			} else {
				event.Score.Away++
			}
		}

		event.UpdatedAt = time.Now().UTC()
		if err := s.repo.SetEvent(ctx, *event); err != nil {
			s.logger.Error("failed to update event", "error", err, "event_id", event.ID)
		}
	}
}

func (s *Simulator) resultRandomEvent(ctx context.Context) {
	// Find a live event to result.
	var liveIndices []int
	for i, event := range s.events {
		if event.Status == "live" {
			liveIndices = append(liveIndices, i)
		}
	}

	if len(liveIndices) == 0 {
		return
	}

	idx := liveIndices[s.rng.Intn(len(liveIndices))]
	event := &s.events[idx]
	event.Status = "resulted"

	if event.Score == nil {
		event.Score = &models.Score{
			Home: s.rng.Intn(5),
			Away: s.rng.Intn(5),
		}
	}

	// Determine market results.
	var results []models.MarketResult
	for mi := range event.Markets {
		market := &event.Markets[mi]
		market.Status = "resulted"

		var winnerIdx int
		switch market.Type {
		case "match_winner":
			if event.Score.Home > event.Score.Away {
				winnerIdx = 0
			} else if event.Score.Away > event.Score.Home {
				winnerIdx = 2
			} else {
				winnerIdx = 1
			}
		case "over_under":
			totalGoals := event.Score.Home + event.Score.Away
			if totalGoals > 2 {
				winnerIdx = 0
			} else {
				winnerIdx = 1
			}
		}

		for si := range market.Selections {
			if si == winnerIdx {
				market.Selections[si].Status = "won"
			} else {
				market.Selections[si].Status = "lost"
			}
		}

		if winnerIdx < len(market.Selections) {
			results = append(results, models.MarketResult{
				MarketID:         market.ID,
				WinningSelection: market.Selections[winnerIdx].ID,
			})
		}
	}

	event.UpdatedAt = time.Now().UTC()
	if err := s.repo.SetEvent(ctx, *event); err != nil {
		s.logger.Error("failed to result event", "error", err, "event_id", event.ID)
	}

	// Publish event.resulted to Kafka.
	result := models.EventResult{
		EventID:   event.ID,
		HomeScore: event.Score.Home,
		AwayScore: event.Score.Away,
		Results:   results,
		Timestamp: time.Now().UTC(),
	}
	data, _ := json.Marshal(result)
	if s.producer != nil {
		_ = s.producer.Publish(ctx, kafka.TopicEventResulted, []byte(event.ID.String()), data)
	}

	s.logger.Info("event resulted",
		"event_id", event.ID,
		"name", event.Name,
		"score", fmt.Sprintf("%d-%d", event.Score.Home, event.Score.Away),
	)
}

func (s *Simulator) addNewEvent(ctx context.Context) {
	sport := s.sports[s.rng.Intn(len(s.sports))]

	teamPool := []string{
		"Alpha FC", "Beta United", "Gamma City", "Delta Athletic",
		"Epsilon Town", "Zeta Stars", "Eta Wanderers", "Theta Rangers",
	}

	home := teamPool[s.rng.Intn(len(teamPool))]
	away := teamPool[s.rng.Intn(len(teamPool))]
	for away == home {
		away = teamPool[s.rng.Intn(len(teamPool))]
	}

	event := s.generateEvent(sport, home, away)
	s.events = append(s.events, event)

	if err := s.repo.SetEvent(ctx, event); err != nil {
		s.logger.Error("failed to add new event", "error", err)
	}

	s.logger.Info("new event added",
		"event_id", event.ID,
		"sport", sport.Name,
		"name", event.Name,
	)
}

func (s *Simulator) randomOdds(min, max float64) float64 {
	odds := min + s.rng.Float64()*(max-min)
	return math.Round(odds*100) / 100
}

// uuidFromSeed generates a deterministic UUID from a string seed for stable sport IDs.
func uuidFromSeed(seed string) uuid.UUID {
	return uuid.NewSHA1(uuid.NameSpaceURL, []byte("odin:sport:"+seed))
}
