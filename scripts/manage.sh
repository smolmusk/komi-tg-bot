#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_BUILD_DIR="$BACKEND_DIR/dist"
FRONTEND_BUILD_DIR="$ROOT_DIR/public"
ENV_BACKEND="$BACKEND_DIR/.env"
ENV_BACKEND_EXAMPLE="$BACKEND_DIR/.env.example"
ENV_FRONTEND="$FRONTEND_DIR/.env"
ENV_FRONTEND_EXAMPLE="$FRONTEND_DIR/.env.example"

usage() {
  cat <<'USAGE'
Usage: manage.sh <command>

Commands:
  build-backend    Install deps (yarn) and build backend
  build-frontend   Install deps (yarn) and build frontend
  build            Build backend and frontend
  start-backend    Start backend in dev mode (yarn dev)
  start-frontend   Start frontend dev server (yarn dev)
  start            Start backend + frontend (both in dev mode)
  stop             Stop all services
  kill             Kill all node processes for this project
  restart          Kill all services and start them fresh
  test-backend     Run backend tests
USAGE
}

ensure_yarn() {
  if [ -f "$ROOT_DIR/.yarn/releases/yarn-4.10.3.cjs" ]; then
    YARN_CMD=(node "$ROOT_DIR/.yarn/releases/yarn-4.10.3.cjs")
  elif command -v yarn >/dev/null 2>&1; then
    YARN_CMD=(yarn)
  else
    echo "[error] yarn is required but not found" >&2
    exit 1
  fi
}

ensure_env() {
  local target="$1"
  local example="$2"
  if [ ! -f "$target" ]; then
    if [ -f "$example" ]; then
      echo "[info] Missing $(basename "$target"), copying from example"
      cp "$example" "$target"
    else
      echo "[warn] Missing $(basename "$target") and no example provided"
    fi
  fi
}

build_backend() {
  ensure_env "$ENV_BACKEND" "$ENV_BACKEND_EXAMPLE"
  ensure_yarn
  pushd "$BACKEND_DIR" >/dev/null
  "${YARN_CMD[@]}" install --silent --frozen-lockfile || "${YARN_CMD[@]}" install --silent
  "${YARN_CMD[@]}" build
  popd >/dev/null
}

build_frontend() {
  ensure_env "$ENV_FRONTEND" "$ENV_FRONTEND_EXAMPLE"
  ensure_yarn
  pushd "$FRONTEND_DIR" >/dev/null
  "${YARN_CMD[@]}" install --silent --frozen-lockfile || "${YARN_CMD[@]}" install --silent
  "${YARN_CMD[@]}" build
  popd >/dev/null
}

start_backend() {
  ensure_env "$ENV_BACKEND" "$ENV_BACKEND_EXAMPLE"
  ensure_yarn
  pushd "$BACKEND_DIR" >/dev/null
  "${YARN_CMD[@]}" dev & echo $! > "$ROOT_DIR/.backend.pid"
  popd >/dev/null
  echo "[info] Backend running (PID $(cat "$ROOT_DIR/.backend.pid"))"
}

start_frontend() {
  ensure_env "$ENV_FRONTEND" "$ENV_FRONTEND_EXAMPLE"
  ensure_yarn
  pushd "$FRONTEND_DIR" >/dev/null
  "${YARN_CMD[@]}" dev --host 0.0.0.0 & echo $! > "$ROOT_DIR/.frontend.pid"
  popd >/dev/null
  echo "[info] Frontend dev server running (PID $(cat "$ROOT_DIR/.frontend.pid"))"
}

stop_process() {
  local pid_file="$1"
  if [ -f "$pid_file" ]; then
    local pid
    pid=$(cat "$pid_file")
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid"
      wait "$pid" 2>/dev/null || true
      echo "[info] Stopped process $pid"
    fi
    rm -f "$pid_file"
  fi
}

stop() {
  stop_process "$ROOT_DIR/.frontend.pid"
  stop_process "$ROOT_DIR/.backend.pid"
}

kill_all() {
  echo "[info] Killing all node processes related to this project..."
  pkill -9 -f "yarn.*dev" 2>/dev/null || true
  pkill -9 -f "node.*yarn" 2>/dev/null || true
  pkill -9 -f "tsx" 2>/dev/null || true
  rm -f "$ROOT_DIR/.backend.pid" "$ROOT_DIR/.frontend.pid"
  sleep 2
  echo "[info] All processes killed"
}

restart() {
  echo "[info] Restarting all services..."
  kill_all
  sleep 2
  start_backend
  sleep 2
  start_frontend
  echo "[info] All services restarted"
}

command="${1:-}" || true
if [ -z "$command" ]; then
  usage
  exit 1
fi
shift || true

case "$command" in
  build)
    build_backend
    build_frontend
    ;;
  build-backend)
    build_backend
    ;;
  build-frontend)
    build_frontend
    ;;
  start)
    start_backend
    sleep 2
    start_frontend
    ;;
  start-backend)
    start_backend
    ;;
  start-frontend)
    start_frontend
    ;;
  stop)
    stop
    ;;
  kill)
    kill_all
    ;;
  restart)
    restart
    ;;
  test-backend)
    ensure_yarn
    pushd "$BACKEND_DIR" >/dev/null
    "${YARN_CMD[@]}" test
    popd >/dev/null
    ;;
  *)
    usage
    exit 1
    ;;
esac
