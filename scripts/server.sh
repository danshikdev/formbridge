#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
SECRETS_DIR="$ROOT_DIR/secrets"
LOGS_DIR="$ROOT_DIR/logs"
PIDS_DIR="$ROOT_DIR/.pids"

BACKEND_ENV_SOURCE="$SECRETS_DIR/backend.env.production"
FRONTEND_ENV_SOURCE="$SECRETS_DIR/frontend.env.production"
BACKEND_PID_FILE="$PIDS_DIR/backend.pid"
FRONTEND_PID_FILE="$PIDS_DIR/frontend.pid"
BACKEND_LOG="$LOGS_DIR/backend.log"
FRONTEND_LOG="$LOGS_DIR/frontend.log"
FRONTEND_PORT="${FRONTEND_PORT:-5174}"

mkdir -p "$LOGS_DIR" "$PIDS_DIR"

bold() { printf "\033[1m%s\033[0m\n" "$*"; }
ok() { printf "\033[32m[OK]\033[0m %s\n" "$*"; }
info() { printf "\033[36m[INFO]\033[0m %s\n" "$*"; }
warn() { printf "\033[33m[WARN]\033[0m %s\n" "$*"; }
fail() { printf "\033[31m[FAIL]\033[0m %s\n" "$*"; }

run_step() {
  local title="$1"
  shift
  info "$title"
  "$@"
  ok "$title"
}

is_running() {
  local pid_file="$1"
  [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null
}

stop_one() {
  local name="$1"
  local pid_file="$2"

  if is_running "$pid_file"; then
    local pid
    pid="$(cat "$pid_file")"
    info "Stopping $name (PID $pid)"
    kill "$pid" 2>/dev/null || true

    for _ in 1 2 3 4 5; do
      if ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
      sleep 1
    done

    if kill -0 "$pid" 2>/dev/null; then
      warn "$name did not stop gracefully, killing"
      kill -9 "$pid" 2>/dev/null || true
    fi
    ok "$name stopped"
  else
    warn "$name is not running"
  fi

  rm -f "$pid_file"
}

restore_env() {
  if [ ! -f "$BACKEND_ENV_SOURCE" ]; then
    fail "Missing $BACKEND_ENV_SOURCE"
    exit 1
  fi

  if [ ! -f "$FRONTEND_ENV_SOURCE" ]; then
    fail "Missing $FRONTEND_ENV_SOURCE"
    exit 1
  fi

  cp "$BACKEND_ENV_SOURCE" "$BACKEND_DIR/.env.production"
  cp "$FRONTEND_ENV_SOURCE" "$FRONTEND_DIR/.env.production"
  cp "$FRONTEND_ENV_SOURCE" "$FRONTEND_DIR/.env"
}

pull_latest() {
  if git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git -C "$ROOT_DIR" pull --ff-only
  else
    warn "Not a git worktree, skipping git pull"
  fi
}

install_deps() {
  npm --prefix "$BACKEND_DIR" install
  npm --prefix "$FRONTEND_DIR" install
}

build_frontend() {
  npm --prefix "$FRONTEND_DIR" run build
}

start_backend() {
  if is_running "$BACKEND_PID_FILE"; then
    warn "Backend is already running (PID $(cat "$BACKEND_PID_FILE"))"
    return
  fi

  : > "$BACKEND_LOG"
  (
    cd "$BACKEND_DIR"
    NODE_ENV=production ENV_FILE=.env.production npm start
  ) >> "$BACKEND_LOG" 2>&1 &
  echo $! > "$BACKEND_PID_FILE"

  sleep 2
  if is_running "$BACKEND_PID_FILE"; then
    ok "Backend started (PID $(cat "$BACKEND_PID_FILE"))"
  else
    fail "Backend failed to start. Last log lines:"
    tail -n 60 "$BACKEND_LOG" || true
    exit 1
  fi
}

start_frontend() {
  if is_running "$FRONTEND_PID_FILE"; then
    warn "Frontend is already running (PID $(cat "$FRONTEND_PID_FILE"))"
    return
  fi

  : > "$FRONTEND_LOG"
  (
    cd "$FRONTEND_DIR"
    npm run preview -- --host 0.0.0.0 --port "$FRONTEND_PORT"
  ) >> "$FRONTEND_LOG" 2>&1 &
  echo $! > "$FRONTEND_PID_FILE"

  sleep 2
  if is_running "$FRONTEND_PID_FILE"; then
    ok "Frontend started (PID $(cat "$FRONTEND_PID_FILE"))"
  else
    fail "Frontend failed to start. Last log lines:"
    tail -n 60 "$FRONTEND_LOG" || true
    exit 1
  fi
}

start_all() {
  run_step "Restoring production env files" restore_env
  start_backend
  start_frontend
  show_status
}

stop_all() {
  stop_one "frontend" "$FRONTEND_PID_FILE"
  stop_one "backend" "$BACKEND_PID_FILE"
}

restart_all() {
  stop_all
  start_all
}

deploy() {
  bold "FormBridge local production deploy"
  run_step "Pulling latest code" pull_latest
  run_step "Restoring production env files" restore_env
  run_step "Installing dependencies" install_deps
  run_step "Building frontend" build_frontend
  stop_all
  start_backend
  start_frontend
  show_status
}

show_status() {
  bold "FormBridge status"

  if is_running "$BACKEND_PID_FILE"; then
    ok "Backend running: PID $(cat "$BACKEND_PID_FILE")"
  else
    warn "Backend stopped"
  fi

  if is_running "$FRONTEND_PID_FILE"; then
    ok "Frontend running: PID $(cat "$FRONTEND_PID_FILE")"
  else
    warn "Frontend stopped"
  fi

  info "Backend log:  $BACKEND_LOG"
  info "Frontend log: $FRONTEND_LOG"
  info "Frontend URL: http://localhost:$FRONTEND_PORT"
}

show_logs() {
  local target="${1:-all}"
  case "$target" in
    backend)
      tail -n 120 -f "$BACKEND_LOG"
      ;;
    frontend)
      tail -n 120 -f "$FRONTEND_LOG"
      ;;
    all)
      bold "Backend log"
      tail -n 80 "$BACKEND_LOG" 2>/dev/null || true
      bold "Frontend log"
      tail -n 80 "$FRONTEND_LOG" 2>/dev/null || true
      ;;
    *)
      fail "Unknown logs target: $target"
      exit 1
      ;;
  esac
}

usage() {
  cat <<EOF
Usage:
  ./scripts/server.sh deploy
  ./scripts/server.sh start
  ./scripts/server.sh stop
  ./scripts/server.sh restart
  ./scripts/server.sh status
  ./scripts/server.sh logs [backend|frontend|all]

Environment:
  FRONTEND_PORT=5174 ./scripts/server.sh start
EOF
}

case "${1:-}" in
  deploy)
    deploy
    ;;
  start)
    start_all
    ;;
  stop)
    stop_all
    ;;
  restart)
    restart_all
    ;;
  status)
    show_status
    ;;
  logs)
    show_logs "${2:-all}"
    ;;
  help|-h|--help|"")
    usage
    ;;
  *)
    fail "Unknown command: $1"
    usage
    exit 1
    ;;
esac
