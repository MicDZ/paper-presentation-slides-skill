#!/usr/bin/env bash
# Export a deck to PDF (one 16:9 page per slide, fragments expanded).
#
#   html/tools/export-pdf.sh path/to/slides.html [out.pdf]
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/_chrome.sh"
[ $# -ge 1 ] || { echo "usage: $0 deck.html [out.pdf]" >&2; exit 2; }
chrome="$(find_chrome)"
url="$(to_url "$1")"
out="${2:-${1%.html}.pdf}"
case "$out" in /*) ;; *) out="$(pwd)/$out" ;; esac
profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT
"$chrome" --headless=new --disable-gpu --no-first-run --user-data-dir="$profile" \
  --no-pdf-header-footer --virtual-time-budget="${BUDGET_MS:-15000}" \
  --print-to-pdf="$out" "${url%%#*}?print" >/dev/null 2>&1
echo "wrote $out"
