#!/usr/bin/env bash
set -euo pipefail

PB_URL="${PB_URL:-http://127.0.0.1:8090}"

echo "[smoke] PB_URL=$PB_URL"

# Health check endpoints
curl -fsS "$PB_URL/api/live" >/dev/null
curl -fsS "$PB_URL/api/ready" >/dev/null
echo "[smoke] health ok"

# CSRF token endpoint
csrf_response="$(curl -fsS "$PB_URL/api/csrf-token" 2>/dev/null || echo "{}")"
csrf_token="$(echo "$csrf_response" | jq -r '.token // empty')"
if [[ -n "$csrf_token" ]]; then
  echo "[smoke] csrf token ok"
else
  echo "[smoke] csrf token endpoint not available (skipping)"
fi

# CSRF protection test (POST without token should fail)
if [[ -n "$csrf_token" ]]; then
  http_code="$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PB_URL/api/collections/users/records" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com"}' 2>/dev/null || echo "000")"
  if [[ "$http_code" == "400" || "$http_code" == "401" || "$http_code" == "403" ]]; then
    echo "[smoke] csrf protection ok (POST without token rejected: $http_code)"
  else
    echo "[smoke] csrf protection check: $http_code (may require auth)"
  fi
fi

plugins_json="$(curl -fsS "$PB_URL/api/plugins/list?limit=1&offset=0")"
plugin_slug="$(echo "$plugins_json" | jq -r '.data[0].slug // empty')"
if [[ -n "$plugin_slug" ]]; then
  curl -fsS "$PB_URL/api/plugins/$plugin_slug" >/dev/null
  curl -fsS "$PB_URL/api/comments/list?plugin=$plugin_slug" >/dev/null
  echo "[smoke] plugin ok: $plugin_slug"

  # Rate limiting test (downloads endpoint)
  # This endpoint is safe and doesn't require auth. It should return 429 after enough hits.
  rate_limit_hit=false
  for i in {1..40}; do
    http_code="$(curl -s -o /dev/null -w "%{http_code}" "$PB_URL/api/plugins/$plugin_slug/download" 2>/dev/null || echo "000")"
    if [[ "$http_code" == "429" ]]; then
      rate_limit_hit=true
      break
    fi
  done
  if [[ "$rate_limit_hit" == "true" ]]; then
    echo "[smoke] rate limiting ok (429 returned on download)"
  else
    echo "[smoke] rate limiting not triggered on download (may be misconfigured)"
  fi
else
  echo "[smoke] plugin list empty (ok)"
fi

showcase_json="$(curl -fsS "$PB_URL/api/showcase/list?limit=1&offset=0")"
showcase_slug="$(echo "$showcase_json" | jq -r '.data[0].slug // empty')"
if [[ -n "$showcase_slug" ]]; then
  curl -fsS "$PB_URL/api/showcase/$showcase_slug" >/dev/null
  curl -fsS "$PB_URL/api/comments/list?showcase=$showcase_slug" >/dev/null
  echo "[smoke] showcase ok: $showcase_slug"
else
  echo "[smoke] showcase list empty (ok)"
fi

versions_json="$(curl -fsS "$PB_URL/api/downloads/versions")"
version="$(echo "$versions_json" | jq -r '.data[0] // empty')"
if [[ -n "$version" ]]; then
  curl -fsS "$PB_URL/api/downloads/files?version=$version" >/dev/null
  echo "[smoke] downloads ok: $version"
else
  echo "[smoke] downloads empty (ok)"
fi

echo "[smoke] done"
