#!/usr/bin/env bash
# Build the arm64 image on this machine and push it to the private registry.
# Usage: deploy/build-push.sh [version]   (default 0.2.0)
set -euo pipefail
VERSION="${1:-0.2.0}"
REGISTRY="registry.bavaro.org:5000"
IMAGE="$REGISTRY/my-dashboard:$VERSION"
CA="${REGISTRY_CA:-$HOME/.docker/certs.d/$REGISTRY/ca.crt}"

docker buildx build --platform linux/arm64 -t "$IMAGE" --push .

tags="$(curl -sSf --cacert "$CA" "https://$REGISTRY/v2/my-dashboard/tags/list")"
echo "$tags"
echo "$tags" | grep -q "\"$VERSION\"" || { echo "FAIL: tag $VERSION not in registry" >&2; exit 1; }
echo "pushed $IMAGE"
