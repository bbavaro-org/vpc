#!/usr/bin/env bash
# User-flow probe: dashboard shell is served and its main JS carries no raw rows.
set -euo pipefail
URL="${1:-https://www.bavaro.org/}"
html="$(curl -sSf "$URL")"
echo "$html" | grep -qi '<div id="root"' || { echo "FAIL: not the dashboard shell" >&2; exit 1; }
src="$(echo "$html" | grep -oE 'src="[^"]+\.js"' | head -1 | sed -e 's/^src="//' -e 's/"$//')"
[ -n "$src" ] || { echo "FAIL: no main JS referenced" >&2; exit 1; }
case "$src" in http*) js_url="$src" ;; /*) js_url="${URL%/}$src" ;; *) js_url="${URL%/}/$src" ;; esac
js="$(curl -sSf "$js_url")"
if echo "$js" | grep -qE '(ap|iq|cl|wl)-[0-9]{5}'; then echo "FAIL: raw row id in served JS" >&2; exit 1; fi
if echo "$js" | grep -qE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}'; then echo "FAIL: ISO timestamp in served JS" >&2; exit 1; fi
echo ok
