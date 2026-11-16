# Locate a Chromium-based browser. Override with CHROME=/path/to/chrome.
find_chrome() {
  if [ -n "${CHROME:-}" ]; then echo "$CHROME"; return; fi
  for c in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
    google-chrome google-chrome-stable chromium chromium-browser microsoft-edge; do
    if [ -x "$c" ] || command -v "$c" >/dev/null 2>&1; then echo "$c"; return; fi
  done
  echo "error: no Chrome/Chromium found; set CHROME=/path/to/chrome" >&2
  exit 2
}
to_url() {
  case "$1" in
    http://*|https://*|file://*) echo "$1" ;;
    /*) echo "file://$1" ;;
    *) echo "file://$(cd "$(dirname "$1")" && pwd)/$(basename "$1")" ;;
  esac
}
