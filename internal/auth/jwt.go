package auth

import (
	"crypto/rsa"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// TokenPair holds a freshly generated access + refresh token.
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// JWTManager handles RS256 token generation and validation.
type JWTManager struct {
	privateKey         *rsa.PrivateKey
	publicKey          *rsa.PublicKey
	accessTokenExpiry  time.Duration
	refreshTokenExpiry time.Duration
}

// NewJWTManager loads RSA keys from PEM files and returns a manager.
func NewJWTManager(privateKeyPath, publicKeyPath string, accessExpiry, refreshExpiry time.Duration) (*JWTManager, error) {
	privBytes, err := os.ReadFile(privateKeyPath)
	if err != nil {
		return nil, fmt.Errorf("auth: read private key: %w", err)
	}

	privKey, err := jwt.ParseRSAPrivateKeyFromPEM(privBytes)
	if err != nil {
		return nil, fmt.Errorf("auth: parse private key: %w", err)
	}

	pubBytes, err := os.ReadFile(publicKeyPath)
	if err != nil {
		return nil, fmt.Errorf("auth: read public key: %w", err)
	}

	pubKey, err := jwt.ParseRSAPublicKeyFromPEM(pubBytes)
	if err != nil {
		return nil, fmt.Errorf("auth: parse public key: %w", err)
	}

	return &JWTManager{
		privateKey:         privKey,
		publicKey:          pubKey,
		accessTokenExpiry:  accessExpiry,
		refreshTokenExpiry: refreshExpiry,
	}, nil
}

// NewJWTManagerFromKeys creates a manager directly from parsed keys (useful for testing).
func NewJWTManagerFromKeys(privKey *rsa.PrivateKey, pubKey *rsa.PublicKey, accessExpiry, refreshExpiry time.Duration) *JWTManager {
	return &JWTManager{
		privateKey:         privKey,
		publicKey:          pubKey,
		accessTokenExpiry:  accessExpiry,
		refreshTokenExpiry: refreshExpiry,
	}
}

// GenerateTokenPair creates a signed access/refresh token pair for the given claims.
func (m *JWTManager) GenerateTokenPair(claims Claims) (accessToken, refreshToken string, err error) {
	now := time.Now()

	accessClaims := jwt.MapClaims{
		"player_id":  claims.PlayerID.String(),
		"email":      claims.Email,
		"kyc_status": claims.KYCStatus,
		"roles":      claims.Roles,
		"brand_id":   claims.BrandID.String(),
		"token_type": "access",
		"iat":        now.Unix(),
		"exp":        now.Add(m.accessTokenExpiry).Unix(),
		"jti":        uuid.New().String(),
	}

	accessJWT := jwt.NewWithClaims(jwt.SigningMethodRS256, accessClaims)
	accessToken, err = accessJWT.SignedString(m.privateKey)
	if err != nil {
		return "", "", fmt.Errorf("auth: sign access token: %w", err)
	}

	refreshClaims := jwt.MapClaims{
		"player_id":  claims.PlayerID.String(),
		"brand_id":   claims.BrandID.String(),
		"token_type": "refresh",
		"iat":        now.Unix(),
		"exp":        now.Add(m.refreshTokenExpiry).Unix(),
		"jti":        uuid.New().String(),
	}

	refreshJWT := jwt.NewWithClaims(jwt.SigningMethodRS256, refreshClaims)
	refreshToken, err = refreshJWT.SignedString(m.privateKey)
	if err != nil {
		return "", "", fmt.Errorf("auth: sign refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}

// ValidateToken parses and validates an RS256 token, returning the claims.
func (m *JWTManager) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("auth: unexpected signing method: %v", t.Header["alg"])
		}
		return m.publicKey, nil
	})
	if err != nil {
		return nil, fmt.Errorf("auth: parse token: %w", err)
	}

	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("auth: invalid token claims")
	}

	playerID, err := uuid.Parse(stringFromClaims(mapClaims, "player_id"))
	if err != nil {
		return nil, fmt.Errorf("auth: invalid player_id in token: %w", err)
	}

	brandID, err := uuid.Parse(stringFromClaims(mapClaims, "brand_id"))
	if err != nil {
		return nil, fmt.Errorf("auth: invalid brand_id in token: %w", err)
	}

	var roles []string
	if r, ok := mapClaims["roles"].([]interface{}); ok {
		for _, v := range r {
			if s, ok := v.(string); ok {
				roles = append(roles, s)
			}
		}
	}

	return &Claims{
		PlayerID:  playerID,
		Email:     stringFromClaims(mapClaims, "email"),
		KYCStatus: stringFromClaims(mapClaims, "kyc_status"),
		Roles:     roles,
		BrandID:   brandID,
	}, nil
}

func stringFromClaims(m jwt.MapClaims, key string) string {
	v, _ := m[key].(string)
	return v
}
