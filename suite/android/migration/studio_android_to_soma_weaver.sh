#!/usr/bin/env bash
# studio_android_to_soma_weaver.sh
# Do–Re–Mi one-shot: Gate1 re-witness + move Android estate into Field-NixOS-SOMA suite/android
# RUN ON MAC STUDIO (green desk). Cloud seats cannot see /Users/jbear.
#
# Matrix law: do not collapse lines into outcome — emit receipts; HOLD when pins missing.
# Residence: teal SOMA · not slate Pulse · not green DOJO destination.
set -euo pipefail

TS="$(date -u +%Y-%m-%dT%H%M%SZ)"
FIELD_ROOT="${FIELD_ROOT:-/Users/jbear/FIELD}"
KITT_SRC="${KITT_SRC:-$FIELD_ROOT/◼︎DOJO/kitt-arkadas-android}"
SONOC_SRC="${SONOC_SRC:-/Users/jbear/AndroidStudioProjects/SonocScrewDriver}"
SOMA_CLONE="${SOMA_CLONE:-$HOME/FIELD-SOMA-WORK/Field-NixOS-SOMA}"
SOMA_REMOTE="${SOMA_REMOTE:-https://github.com/nexus-infinity/Field-NixOS-SOMA.git}"
BRANCH="${BRANCH:-cursor/soma-android-content-move-684b}"
RECEIPT_DIR=""
DRY_RUN="${DRY_RUN:-0}"

log() { printf '%s\n' "$*"; }
die() { printf 'HOLD/FAIL: %s\n' "$*" >&2; exit 1; }

need_mac() {
  [[ "$(uname -s)" == "Darwin" ]] || die "This weaver must run on Mac Studio (Darwin). Cloud seat cannot complete Gate1 Mac half."
  [[ -d /Users/jbear ]] || die "/Users/jbear missing — wrong desk."
}

stage_do() {
  log "=== Do — ground ==="
  need_mac
  mkdir -p "$(dirname "$SOMA_CLONE")"
  if [[ ! -d "$SOMA_CLONE/.git" ]]; then
    git clone "$SOMA_REMOTE" "$SOMA_CLONE"
  fi
  cd "$SOMA_CLONE"
  git fetch origin
  git checkout main
  git pull --ff-only origin main || true
  # Prefer existing suite home branch if present
  if git show-ref --verify --quiet "refs/remotes/origin/cursor/soma-android-suite-home-684b"; then
    git checkout -B "$BRANCH" "origin/cursor/soma-android-suite-home-684b" || git checkout -B "$BRANCH"
  else
    git checkout -B "$BRANCH"
  fi
  RECEIPT_DIR="$SOMA_CLONE/suite/android/migration/receipts"
  mkdir -p "$RECEIPT_DIR" \
    "$SOMA_CLONE/suite/android/apps" \
    "$SOMA_CLONE/suite/android/lab"
  log "SOMA clone: $SOMA_CLONE"
  log "Receipt dir: $RECEIPT_DIR"
}

stage_re() {
  log "=== Re — ingest / re-witness ==="
  {
    echo "timestamp_utc: $TS"
    echo "host: $(hostname)"
    echo "uname: $(uname -a)"
    echo
    echo "## paths"
    for p in "$KITT_SRC" "$SONOC_SRC" \
      "$HOME/Library/Android" \
      "$HOME/AndroidStudioProjects" \
      "$HOME/FIELD-ANDROID-BACKUPS" \
      "$HOME/FIELD-ANDROID-SYNC"; do
      if [[ -e "$p" ]]; then
        echo "PRESENT  $(du -sh "$p" 2>/dev/null | awk '{print $1}')  $p"
      else
        echo "ABSENT   -  $p"
      fi
    done
    echo
    echo "## find android (maxdepth 4 under FIELD)"
    find "$FIELD_ROOT" -iname '*android*' -maxdepth 4 2>/dev/null | head -80 || true
  } | tee "$RECEIPT_DIR/GATE1_REWITNESS_${TS}.txt"
}

stage_mi() {
  log "=== Mi — verify KITT coherence ==="
  if [[ ! -d "$KITT_SRC" ]]; then
    echo "HOLD.KittSourceMissing path=$KITT_SRC" | tee "$RECEIPT_DIR/HOLD_KITT_${TS}.txt"
    die "KITT source missing — cannot Fa without source. Receipt written."
  fi
  (
    cd "$KITT_SRC"
    {
      echo "timestamp_utc: $TS"
      echo "## git remote -v"
      git remote -v 2>/dev/null || echo "NO_GIT_OR_NO_REMOTE"
      echo "## git status -sb"
      git status -sb 2>/dev/null || true
      echo "## git log -5 --oneline"
      git log -5 --oneline 2>/dev/null || true
    } | tee "$RECEIPT_DIR/KITT_GIT_${TS}.txt"
  )
}

stage_fa() {
  log "=== Fa — transform / copy into SOMA suite ==="
  DEST_KITT="$SOMA_CLONE/suite/android/apps/kitt-arkadas-android"
  DEST_SONOC="$SOMA_CLONE/suite/android/lab/SonocScrewDriver"
  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY_RUN=1 — skip rsync"
    return 0
  fi
  mkdir -p "$DEST_KITT"
  rsync -a --delete --exclude '.gradle' --exclude 'build' --exclude '.idea' \
    "$KITT_SRC/" "$DEST_KITT/"
  echo "MOVED_OR_SYNCED KITT -> $DEST_KITT" | tee "$RECEIPT_DIR/MOVE_KITT_${TS}.txt"

  if [[ -d "$SONOC_SRC" ]]; then
    mkdir -p "$DEST_SONOC"
    rsync -a --exclude '.gradle' --exclude 'build' --exclude '.idea' \
      "$SONOC_SRC/" "$DEST_SONOC/"
    echo "MOVED_OR_SYNCED SONOC -> $DEST_SONOC" | tee "$RECEIPT_DIR/MOVE_SONOC_${TS}.txt"
  else
    echo "HOLD.SonocSourceAbsent" | tee "$RECEIPT_DIR/HOLD_SONOC_${TS}.txt"
  fi
}

stage_sol() {
  log "=== Sol — DOJO stub pointer (leave green path as pointer only) ==="
  STUB_DIR="$FIELD_ROOT/◼︎DOJO/kitt-arkadas-android"
  STUB_FILE="$STUB_DIR/MOVED_TO_SOMA_SUITE.md"
  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY_RUN=1 — skip stub write"
    return 0
  fi
  if [[ -d "$STUB_DIR" ]]; then
    # If we rsynced out of tree that is still the same folder, write stub beside after move.
    # Prefer: if destination exists in SOMA and source still present, replace source tree with stub.
    :
  fi
  TEMPLATE="$SOMA_CLONE/suite/android/migration/DOJO_STUB_README.md"
  if [[ -f "$TEMPLATE" ]]; then
    # After successful sync, leave a pointer file in DOJO path without deleting history unless MOVE_MODE=replace
    if [[ "${MOVE_MODE:-pointer}" == "replace" ]]; then
      BACKUP="$HOME/FIELD-ANDROID-BACKUPS/kitt-arkadas-android-pre-soma-${TS}"
      mkdir -p "$HOME/FIELD-ANDROID-BACKUPS"
      if [[ -d "$KITT_SRC" ]] && [[ "$(cd "$KITT_SRC" && pwd)" != "$(cd "$SOMA_CLONE/suite/android/apps/kitt-arkadas-android" && pwd)" ]]; then
        mv "$KITT_SRC" "$BACKUP"
        mkdir -p "$KITT_SRC"
        cp "$TEMPLATE" "$KITT_SRC/README.md"
        echo "REPLACED DOJO path with stub; backup at $BACKUP" | tee "$RECEIPT_DIR/DOJO_STUB_${TS}.txt"
      fi
    else
      cp "$TEMPLATE" "$STUB_FILE"
      echo "POINTER stub written: $STUB_FILE (source retained until MOVE_MODE=replace)" | tee "$RECEIPT_DIR/DOJO_STUB_${TS}.txt"
    fi
  fi
}

stage_la() {
  log "=== La — feedback / git status in SOMA ==="
  cd "$SOMA_CLONE"
  git status -sb | tee "$RECEIPT_DIR/SOMA_GIT_STATUS_${TS}.txt"
  git add suite/android
  if git diff --cached --quiet; then
    log "No staged changes (maybe already synced)."
  else
    git commit -m "$(cat <<'EOF'
feat(suite/android): ingest Mac Studio Android estate into SOMA Suite

KITT + lab units synced by studio_android_to_soma_weaver.
Residence: Sovereign SOMA Field. Matrix lines kept open via receipts.
EOF
)"
  fi
}

stage_ti() {
  log "=== Ti — integrate / push ==="
  cd "$SOMA_CLONE"
  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY_RUN=1 — skip push"
    return 0
  fi
  git push -u origin "$BRANCH"
  echo "PUSHED origin/$BRANCH" | tee "$RECEIPT_DIR/PUSH_${TS}.txt"
}

stage_do2() {
  log "=== Do — new ground ==="
  {
    echo "timestamp_utc: $TS"
    echo "status: WEAVER_CYCLE_COMPLETE"
    echo "next_ground:"
    echo "  - open/merge PR for $BRANCH on Field-NixOS-SOMA"
    echo "  - update Linear UNKNOWN_HOLD_REGISTER with Studio receipts"
    echo "  - MOVE_MODE=replace only after PR merged and backup verified"
    echo "matrix: lines remain open; do not collapse to outcome without merge receipt"
  } | tee "$RECEIPT_DIR/NEW_GROUND_${TS}.txt"
  log "DONE weaver cycle. Receipts in $RECEIPT_DIR"
}

# ---- main Do–Re–Mi–Fa–Sol–La–Ti–Do ----
stage_do
stage_re
stage_mi
stage_fa
stage_sol
stage_la
stage_ti
stage_do2
