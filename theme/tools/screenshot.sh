#!/usr/bin/env bash
# Screenshot slides as 1280x720 PNGs for visual review.
#
#   html/tools/screenshot.sh path/to/slides.html out_dir [first] [last]
# Slides are numbered from 1. Without first/last every slide is captured.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
. "$here/_chrome.sh"
[ $# -ge 2 ] || { echo "usage: $0 deck.html out_dir [first] [last]" >&2; exit 2; }
chrome="$(find_chrome)"
url="$(to_url "$1")"; url="${url%%#*}"
mkdir -p "$2"; outdir="$(cd "$2" && pwd)"
first="${3:-1}"
if [ -n "${4:-}" ]; then last="$4"; else
  last="$("$here/check.sh" "$1" 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin)["slides"])' || true)"
  [ -n "$last" ] || last="$first"
fi
for i in $(seq "$first" "$last"); do
  profile="$(mktemp -d)"
  "$chrome" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$profile" \
    --virtual-time-budget="${BUDGET_MS:-10000}" --window-size=1280,720 \
    --screenshot="$outdir/slide-$(printf '%02d' "$i").png" "$url?debug#/$i" >/dev/null 2>&1
  rm -rf "$profile"
done
echo "wrote slides $first-$last to $outdir"
