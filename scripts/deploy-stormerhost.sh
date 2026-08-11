#!/bin/bash

set -Eeo pipefail

readonly SOURCE_ROOT="/home2/arkmedic/repositories/SGH-KUTUNSE"
readonly APPLICATION_ROOT="/home2/arkmedic/sgh-kutunse"
readonly NODE_ENVIRONMENT="/home2/arkmedic/nodevenv/sgh-kutunse/22/bin/activate"

BUILD_ROOT="$(mktemp -d /home2/arkmedic/sgh-kutunse-build.XXXXXX)"
PAYLOAD_ROOT="$(mktemp -d /home2/arkmedic/sgh-kutunse-release.XXXXXX)"

cleanup() {
  rm -rf -- "$BUILD_ROOT" "$PAYLOAD_ROOT"
}
trap cleanup EXIT

test -f "$SOURCE_ROOT/package.json"
test -f "$SOURCE_ROOT/package-lock.json"
test -f "$SOURCE_ROOT/app.js"
test -f "$NODE_ENVIRONMENT"

# Build away from the live application directory. Environment files, logs,
# dependency folders, and previous build output are never copied from Git.
/usr/bin/rsync -a \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.npm-cache \
  --exclude=.env \
  --exclude=.env.local \
  --exclude=.env.production \
  --exclude='*.log' \
  "$SOURCE_ROOT/" "$BUILD_ROOT/"

source "$NODE_ENVIRONMENT"
cd "$BUILD_ROOT"

npm ci --include=dev --no-audit --no-fund
npm run lint
npm run build
npm run stage:stormerhost

# Assemble and validate the complete payload before changing the live root.
mkdir -p "$PAYLOAD_ROOT/.next/standalone" "$PAYLOAD_ROOT/.next/static"
/usr/bin/rsync -a "$BUILD_ROOT/.next/standalone/" "$PAYLOAD_ROOT/.next/standalone/"
/usr/bin/rsync -a "$BUILD_ROOT/.next/static/" "$PAYLOAD_ROOT/.next/static/"
/usr/bin/rsync -a "$BUILD_ROOT/public/" "$PAYLOAD_ROOT/public/"
cp "$BUILD_ROOT/app.js" "$BUILD_ROOT/package.json" "$BUILD_ROOT/package-lock.json" "$PAYLOAD_ROOT/"

test -s "$PAYLOAD_ROOT/app.js"
test -s "$PAYLOAD_ROOT/package.json"
test -s "$PAYLOAD_ROOT/.next/standalone/server.js"
test -d "$PAYLOAD_ROOT/.next/standalone/node_modules"
test -d "$PAYLOAD_ROOT/.next/standalone/.next/static"
test -d "$PAYLOAD_ROOT/.next/standalone/public"
grep -Fq 'import("./.next/standalone/server.js")' "$PAYLOAD_ROOT/app.js"

# No --delete is used: tmp/, stderr.log, environment files, and any other
# host-managed files already in the application root remain intact.
mkdir -p "$APPLICATION_ROOT" "$APPLICATION_ROOT/tmp"
/usr/bin/rsync -a "$PAYLOAD_ROOT/" "$APPLICATION_ROOT/"

echo "Validated StormerHost standalone release copied to $APPLICATION_ROOT."
echo "Passenger was not restarted."
