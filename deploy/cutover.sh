#!/usr/bin/env bash
# Apply the dashboard manifests to the cluster, wait Ready, then (only after
# explicit operator confirmation) remove the apache site and verify.
# Usage: deploy/cutover.sh            apply + wait + verify
#        deploy/cutover.sh --cutover  additionally run the confirmed apache removal
set -euo pipefail
cd "$(dirname "$0")/.."

if command -v kubectl >/dev/null 2>&1 && [ -z "${USE_SSH:-}" ]; then
  KUBECTL=(kubectl)
else
  KUBECTL=(ssh master kubectl)
fi

for f in deploy/k8s/*.yaml; do
  "${KUBECTL[@]}" apply -f - < "$f"
done
"${KUBECTL[@]}" rollout status deploy/dashboard-deployment --timeout=180s

# ---------------------------------------------------------------------------
# CUTOVER: replaces the live apache site. NEVER runs automatically.
# Requires the --cutover flag AND typing "cutover" at the prompt.
# ---------------------------------------------------------------------------
if [ "${1:-}" = "--cutover" ]; then
  printf 'Delete apache Deployment/Service/Ingress and apex ingress? Type "cutover": '
  read -r answer
  if [ "$answer" = "cutover" ]; then
    "${KUBECTL[@]}" delete deployment,service,ingress -l app=apache --ignore-not-found
    "${KUBECTL[@]}" delete ingress apache-apex --ignore-not-found
  else
    echo "cutover not confirmed; apache left in place"
    exit 1
  fi
fi
# ---------------------------------------------------------------------------

curl -sSf https://www.bavaro.org/ | grep -qi '<div id="root"' \
  && echo "dashboard served over valid TLS"
