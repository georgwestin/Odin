#!/bin/bash
# Generate RS256 key pair for JWT signing
set -e

KEYS_DIR="$(dirname "$0")/../keys"
mkdir -p "$KEYS_DIR"

echo "Generating RS256 key pair..."
openssl genrsa -out "$KEYS_DIR/private.pem" 2048
openssl rsa -in "$KEYS_DIR/private.pem" -pubout -out "$KEYS_DIR/public.pem"

echo "Keys generated:"
echo "  Private: $KEYS_DIR/private.pem"
echo "  Public:  $KEYS_DIR/public.pem"
