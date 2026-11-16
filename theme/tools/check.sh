#!/usr/bin/env bash
# Render a deck headlessly and print the theme's QA report (JSON).
# Exit status: 0 = clean, 1 = problems (overflow, missing citations/labels,
# KaTeX errors or warnings), 2 = setup error.
#
#   html/tools/check.sh path/to/slides.html
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/_chrome.sh"
[ $# -ge 1 ] || { echo "usage: $0 deck.html" >&2; exit 2; }
chrome="$(find_chrome)"
url="$(to_url "$1")"
profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT
dom="$("$chrome" --headless=new --disable-gpu --no-first-run --user-data-dir="$profile" \
  --virtual-time-budget="${BUDGET_MS:-15000}" --dump-dom "$url" 2>/dev/null)"
report="$(printf '%s' "$dom" | python3 -c '
import re, sys
m = re.search(r"<script type=\"application/json\" id=\"mbz-report\">(.*?)</script>", sys.stdin.read(), re.S)
print(m.group(1) if m else "")')"
if [ -z "$report" ]; then
  echo "error: no QA report found (is mbzuai-slides.js loaded? did KaTeX/CDN load?)" >&2
  exit 2
fi
printf '%s\n' "$report"
printf '%s' "$report" | python3 -c '
import json, sys
r = json.load(sys.stdin)
bad = r["overflow"] or r["missingCitations"] or r["missingLabels"] or r["katexErrors"] or r["warnings"]
sys.exit(1 if bad else 0)'
