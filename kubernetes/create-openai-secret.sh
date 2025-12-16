#!/usr/bin/env bash
set -euo pipefail

# Helper to create/update the Kubernetes Secret holding the OpenAI API key.
# Usage: ./create-openai-secret.sh <OPENAI_API_KEY> [NAMESPACE]
# Example: ./create-openai-secret.sh "$OPENAI_API_KEY" kubepulse
# This script never writes the key to disk; it uses kubectl to apply the secret.

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <OPENAI_API_KEY> [NAMESPACE]"
  exit 2
fi

OPENAI_KEY="$1"
NAMESPACE="${2:-kubepulse}"

kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f - || true

# Create or update the secret named `backend-secrets` with the provided key.
# We preserve the JWT_SECRET used in the manifest; adjust if needed.
kubectl create secret generic backend-secrets \
  --from-literal=OPENAI_API_KEY="$OPENAI_KEY" \
  --from-literal=JWT_SECRET="kubepulse-secret-change-in-production-2024" \
  -n "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

echo "Secret 'backend-secrets' applied in namespace '$NAMESPACE'."
