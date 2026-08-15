#!/usr/bin/env bash
# studio_android_to_soma_weaver.sh
# Do–Re–Mi one-shot: Gate1 re-witness + move Android estate into Field-NixOS-SOMA suite/android
# RUN ON MAC STUDIO (green desk). Cloud seats cannot see Studio FS.
#
# LOCKED seat map:
#   Local FIELD desk  = /Users/field/   ← THIS is local FIELD (Unix user field)
#   /Users/jbear/     ≠ local FIELD     ← other account / historical Klaus residue only
# Soft HOLD: missing one unit does NOT abort — weave what is PRESENT under field first.
# WHY: GitHub-accurate SOMA home so Mac Studio DOJO can reclaim disk (not keep two full trees).
# Residence: teal SOMA · not slate Pulse · not green DOJO destination.
#
# Studio receipt 2026-08-15T083118Z (macstudio.local, user field):
#   ABSENT  KITT at /Users/field/◼︎DOJO/kitt-arkadas-android
#   PRESENT local PULSE-Android at /Users/field/StudioProjects/PULSE-Android
#   PRESENT /Users/field/Library/Android ~7.1G
#   CROSS-ACCOUNT (not FIELD): Sonoc seen under /Users/jbear/AndroidStudioProjects/...
set -euo pipefail

TS="$(date -u +%Y-%m-%dT%H%M%SZ)"
FIELD_HOME="${FIELD_HOME:-/Users/field}"
# Optional: scan foreign account leftovers — NEVER treat as local FIELD
JBEAR_HOME="${JBEAR_HOME:-/Users/jbear}"
SCAN_JBEAR_LEFTOVERS="${SCAN_JBEAR_LEFTOVERS:-1}"
SOMA_CLONE="${SOMA_CLONE:-$HOME/FIELD-SOMA-WORK/Field-NixOS-SOMA}"
SOMA_REMOTE="${SOMA_REMOTE:-https://github.com/nexus-infinity/Field-NixOS-SOMA.git}"
BRANCH="${BRANCH:-cursor/soma-android-content-move-684b}"
SUITE_HOME_BRANCH="${SUITE_HOME_BRANCH:-cursor/soma-android-suite-home-684b}"
RECEIPT_DIR=""
DRY_RUN="${DRY_RUN:-0}"
MOVED_ANY=0
HOLD_ANY=0

# Resolved by stage_re (first PRESENT under FIELD_HOME wins unless env override)
KITT_SRC="${KITT_SRC:-}"
SONOC_SRC="${SONOC_SRC:-}"
PULSE_ANDROID_SRC="${PULSE_ANDROID_SRC:-}"

log() { printf '%s\n' "$*"; }
hold() {
  HOLD_ANY=1
  printf 'HOLD: %s\n' "$*" >&2
  echo "HOLD: $*" | tee -a "$RECEIPT_DIR/HOLDS_${TS}.txt" >/dev/null
}
die() { printf 'HOLD/FAIL: %s\n' "$*" >&2; exit 1; }

first_present() {
  local p
  for p in "$@"; do
    if [[ -n "$p" && -e "$p" ]]; then
      printf '%s' "$p"
      return 0
    fi
  done
  return 1
}

need_mac() {
  [[ "$(uname -s)" == "Darwin" ]] || die "This weaver must run on Mac Studio (Darwin). Cloud seat cannot complete Gate1 Mac half."
  # Local FIELD is /Users/field — not /Users/jbear
  if [[ ! -d "$FIELD_HOME" ]]; then
    die "Local FIELD desk missing: $FIELD_HOME (jbear is NOT local FIELD)"
  fi
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
  # Prior WEAVE_ONLY used to copy scripts into SOMA and leave a dirty tree — stash, don't abort.
  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    git stash push -u -m "soma-weaver-pre-checkout-${TS}" || true
    log "stashed dirty SOMA worktree before branch switch (stash: soma-weaver-pre-checkout-${TS})"
  fi
  git checkout main
  git pull --ff-only origin main || true
  if git show-ref --verify --quiet "refs/remotes/origin/${SUITE_HOME_BRANCH}"; then
    git checkout -B "$BRANCH" "origin/${SUITE_HOME_BRANCH}" || git checkout -B "$BRANCH"
  else
    git checkout -B "$BRANCH"
  fi
  # Refresh weaver + HOLD register from this script's directory when invoked from pulse packet
  local self_dir
  self_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  mkdir -p suite/android/migration
  if [[ -f "$self_dir/studio_android_to_soma_weaver.sh" ]]; then
    cp -a "$self_dir/studio_android_to_soma_weaver.sh" suite/android/migration/studio_android_to_soma_weaver.sh
    chmod +x suite/android/migration/studio_android_to_soma_weaver.sh
  fi
  if [[ -f "$self_dir/../UNKNOWN_HOLD_REGISTER.md" ]]; then
    cp -a "$self_dir/../UNKNOWN_HOLD_REGISTER.md" suite/android/UNKNOWN_HOLD_REGISTER.md
  fi
  RECEIPT_DIR="$SOMA_CLONE/suite/android/migration/receipts"
  mkdir -p "$RECEIPT_DIR" \
    "$SOMA_CLONE/suite/android/apps" \
    "$SOMA_CLONE/suite/android/lab"
  : >"$RECEIPT_DIR/HOLDS_${TS}.txt"
  log "SOMA clone: $SOMA_CLONE"
  log "Receipt dir: $RECEIPT_DIR"
  log "local_FIELD: $FIELD_HOME  (jbear ≠ FIELD)"
  log "operator_user: $(whoami)  HOME=$HOME"
}

stage_re() {
  log "=== Re — ingest / re-witness + resolve sources (FIELD=/Users/field) ==="

  # FIELD desk candidates first. jbear only if SCAN_JBEAR_LEFTOVERS=1 (not FIELD).
  local -a kitt_cands=(
    "${KITT_SRC}"
    "$FIELD_HOME/◼︎DOJO/kitt-arkadas-android"
    "$FIELD_HOME/FIELD/◼︎DOJO/kitt-arkadas-android"
    "$FIELD_HOME/StudioProjects/kitt-arkadas-android"
    "$FIELD_HOME/AndroidStudioProjects/kitt-arkadas-android"
  )
  local -a sonoc_cands=(
    "${SONOC_SRC}"
    "$FIELD_HOME/AndroidStudioProjects/SonocScrewDriver"
    "$FIELD_HOME/StudioProjects/SonocScrewDriver"
  )
  local -a pulse_cands=(
    "${PULSE_ANDROID_SRC}"
    "$FIELD_HOME/StudioProjects/PULSE-Android"
    "$FIELD_HOME/AndroidStudioProjects/PULSE-Android"
  )

  if [[ "$SCAN_JBEAR_LEFTOVERS" == "1" && -d "$JBEAR_HOME" ]]; then
    kitt_cands+=(
      "$JBEAR_HOME/FIELD/◼︎DOJO/kitt-arkadas-android"
      "$JBEAR_HOME/◼︎DOJO/kitt-arkadas-android"
    )
    sonoc_cands+=(
      "$JBEAR_HOME/AndroidStudioProjects/SonocScrewDriver"
    )
    pulse_cands+=(
      "$JBEAR_HOME/StudioProjects/PULSE-Android"
    )
  fi

  KITT_SRC="$(first_present "${kitt_cands[@]}")" || KITT_SRC=""
  SONOC_SRC="$(first_present "${sonoc_cands[@]}")" || SONOC_SRC=""
  PULSE_ANDROID_SRC="$(first_present "${pulse_cands[@]}")" || PULSE_ANDROID_SRC=""

  {
    echo "timestamp_utc: $TS"
    echo "host: $(hostname)"
    echo "uname: $(uname -a)"
    echo "whoami: $(whoami)"
    echo "HOME: $HOME"
    echo "local_FIELD: $FIELD_HOME"
    echo "jbear_note: /Users/jbear is NOT local FIELD (SCAN_JBEAR_LEFTOVERS=$SCAN_JBEAR_LEFTOVERS)"
    echo
    echo "## resolved sources"
    echo "KITT_SRC=${KITT_SRC:-ABSENT}"
    echo "SONOC_SRC=${SONOC_SRC:-ABSENT}"
    echo "PULSE_ANDROID_SRC=${PULSE_ANDROID_SRC:-ABSENT}"
    if [[ -n "$SONOC_SRC" && "$SONOC_SRC" == "$JBEAR_HOME"* ]]; then
      echo "NOTE: SONOC resolved under jbear leftover path — not FIELD desk home"
    fi
    echo
    echo "## path witness (FIELD desk first)"
    local p
    for p in \
      "$FIELD_HOME/◼︎DOJO/kitt-arkadas-android" \
      "$FIELD_HOME/FIELD/◼︎DOJO/kitt-arkadas-android" \
      "$FIELD_HOME/StudioProjects/PULSE-Android" \
      "$FIELD_HOME/StudioProjects/SonocScrewDriver" \
      "$FIELD_HOME/AndroidStudioProjects/SonocScrewDriver" \
      "$FIELD_HOME/Library/Android" \
      "$FIELD_HOME/AndroidStudioProjects" \
      "$FIELD_HOME/FIELD-ANDROID-BACKUPS" \
      "$FIELD_HOME/FIELD-ANDROID-SYNC"; do
      if [[ -e "$p" ]]; then
        echo "PRESENT  $(du -sh "$p" 2>/dev/null | awk '{print $1}')  $p"
      else
        echo "ABSENT   -  $p"
      fi
    done
    if [[ "$SCAN_JBEAR_LEFTOVERS" == "1" && -d "$JBEAR_HOME" ]]; then
      echo
      echo "## cross-account leftovers (NOT FIELD) under $JBEAR_HOME"
      for p in \
        "$JBEAR_HOME/FIELD/◼︎DOJO/kitt-arkadas-android" \
        "$JBEAR_HOME/AndroidStudioProjects/SonocScrewDriver" \
        "$JBEAR_HOME/Library/Android"; do
        if [[ -e "$p" ]]; then
          echo "LEFTOVER $(du -sh "$p" 2>/dev/null | awk '{print $1}')  $p"
        else
          echo "ABSENT   -  $p"
        fi
      done
    fi
    echo
    echo "## find *kitt* under FIELD desk (maxdepth 5)"
    find "$FIELD_HOME" \( -iname '*kitt*android*' -o -iname 'kitt-arkadas*' \) -maxdepth 5 2>/dev/null | head -40 || true
    if [[ "$SCAN_JBEAR_LEFTOVERS" == "1" && -d "$JBEAR_HOME" ]]; then
      echo
      echo "## find *kitt* under jbear leftovers (NOT FIELD, maxdepth 5)"
      find "$JBEAR_HOME" \( -iname '*kitt*android*' -o -iname 'kitt-arkadas*' \) -maxdepth 5 2>/dev/null | head -40 || true
    fi
    echo
    echo "## find under FIELD StudioProjects / AndroidStudioProjects (maxdepth 3)"
    for root in \
      "$FIELD_HOME/StudioProjects" \
      "$FIELD_HOME/AndroidStudioProjects"; do
      [[ -d "$root" ]] || continue
      echo "# $root"
      find "$root" -maxdepth 3 \( -iname '*android*' -o -iname '*sonoc*' -o -iname '*pulse*' -o -iname '*kitt*' \) 2>/dev/null | head -40 || true
    done
  } | tee "$RECEIPT_DIR/GATE1_REWITNESS_${TS}.txt"
}

stage_mi() {
  log "=== Mi — verify coherence per PRESENT unit (soft HOLD if absent) ==="
  if [[ -z "$KITT_SRC" || ! -d "$KITT_SRC" ]]; then
    hold "HOLD.KittSourceMissing — not under /Users/field DOJO/StudioProjects; continuing without KITT"
  else
    (
      cd "$KITT_SRC"
      {
        echo "timestamp_utc: $TS"
        echo "path: $KITT_SRC"
        echo "## git remote -v"
        git remote -v 2>/dev/null || echo "NO_GIT_OR_NO_REMOTE"
        echo "## git status -sb"
        git status -sb 2>/dev/null || true
        echo "## git log -5 --oneline"
        git log -5 --oneline 2>/dev/null || true
      } | tee "$RECEIPT_DIR/KITT_GIT_${TS}.txt"
    )
  fi

  if [[ -z "$SONOC_SRC" || ! -d "$SONOC_SRC" ]]; then
    hold "HOLD.SonocSourceAbsent"
  else
    echo "OK Sonoc present: $SONOC_SRC" | tee "$RECEIPT_DIR/SONOC_OK_${TS}.txt"
  fi

  if [[ -z "$PULSE_ANDROID_SRC" || ! -d "$PULSE_ANDROID_SRC" ]]; then
    hold "HOLD.PulseAndroidLocalAbsent (GitHub already CONFIRMED_ABSENT)"
  else
    (
      cd "$PULSE_ANDROID_SRC"
      {
        echo "timestamp_utc: $TS"
        echo "path: $PULSE_ANDROID_SRC"
        echo "note: GitHub nexus-infinity/PULSE-Android CONFIRMED_ABSENT — local-only recovery"
        echo "## git remote -v"
        git remote -v 2>/dev/null || echo "NO_GIT_OR_NO_REMOTE"
        echo "## git status -sb"
        git status -sb 2>/dev/null || true
        echo "## top entries"
        ls -la | head -40
      } | tee "$RECEIPT_DIR/PULSE_ANDROID_GIT_${TS}.txt"
    )
  fi
}

rsync_unit() {
  local src="$1" dest="$2" label="$3" receipt="$4"
  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY_RUN=1 — would rsync $label: $src -> $dest"
    return 0
  fi
  mkdir -p "$dest"
  # Never copy nested .git — SOMA must own a normal tree, not a gitlink/submodule.
  rsync -a --delete \
    --exclude '.git' \
    --exclude '.gradle' --exclude 'build' --exclude '.idea' \
    --exclude 'node_modules' --exclude '.cxx' \
    --exclude 'ios/Pods' --exclude 'ios/build' \
    "$src/" "$dest/"
  rm -rf "$dest/.git"
  echo "MOVED_OR_SYNCED $label -> $dest (flattened; no nested .git)" | tee "$receipt"
  MOVED_ANY=1
}

# If a prior cycle committed a gitlink (mode 160000), replace with real files.
flatten_suite_gitlinks() {
  local path mode
  cd "$SOMA_CLONE"
  while read -r mode _ path; do
    [[ "$mode" == "160000" ]] || continue
    case "$path" in
      suite/android/*)
        log "FIX embedded gitlink -> normal tree: $path"
        git rm --cached -f "$path" 2>/dev/null || true
        rm -rf "$SOMA_CLONE/$path/.git"
        hold "HOLD.EmbeddedGitlinkRepaired path=$path — re-ingest as normal files"
        ;;
    esac
  done < <(git ls-files -s 2>/dev/null || true)
  # Belt-and-suspenders: strip any leftover nested repos under suite/android
  find suite/android/apps suite/android/lab -mindepth 2 -maxdepth 3 -name .git 2>/dev/null | while read -r g; do
    log "removing nested $g"
    rm -rf "$g"
  done
}

stage_fa() {
  log "=== Fa — transform / copy PRESENT units into SOMA suite ==="
  local DEST_KITT DEST_SONOC DEST_PULSE
  DEST_KITT="$SOMA_CLONE/suite/android/apps/kitt-arkadas-android"
  DEST_SONOC="$SOMA_CLONE/suite/android/lab/SonocScrewDriver"
  DEST_PULSE="$SOMA_CLONE/suite/android/apps/PULSE-Android"

  if [[ -n "$KITT_SRC" && -d "$KITT_SRC" ]]; then
    rsync_unit "$KITT_SRC" "$DEST_KITT" "KITT" "$RECEIPT_DIR/MOVE_KITT_${TS}.txt"
  else
    log "skip KITT (absent)"
  fi

  if [[ -n "$SONOC_SRC" && -d "$SONOC_SRC" ]]; then
    rsync_unit "$SONOC_SRC" "$DEST_SONOC" "SONOC" "$RECEIPT_DIR/MOVE_SONOC_${TS}.txt"
  else
    log "skip SONOC (absent)"
  fi

  if [[ -n "$PULSE_ANDROID_SRC" && -d "$PULSE_ANDROID_SRC" ]]; then
    rsync_unit "$PULSE_ANDROID_SRC" "$DEST_PULSE" "PULSE-Android-local" "$RECEIPT_DIR/MOVE_PULSE_ANDROID_${TS}.txt"
  else
    log "skip PULSE-Android (absent)"
  fi

  if [[ "$MOVED_ANY" -eq 0 ]]; then
    hold "HOLD.NoUnitsMoved — nothing PRESENT to weave this cycle"
  fi
}

stage_sol() {
  log "=== Sol — reclaim DOJO/FIELD local trees after SOMA sync (space intention) ==="
  # Intention: Android development lives in SOMA (GitHub) → free Mac Studio DOJO disk.
  # pointer (default): leave sources; write MOVED_TO_SOMA_SUITE.md beside them.
  # MOVE_MODE=replace: only for sources under FIELD_HOME; backup then stub (never touch jbear unless FORCE_JBEAR_RECLAIM=1).
  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY_RUN=1 — skip stub/reclaim"
    return 0
  fi
  local TEMPLATE
  TEMPLATE="$SOMA_CLONE/suite/android/migration/DOJO_STUB_README.md"
  if [[ ! -f "$TEMPLATE" ]]; then
    hold "HOLD.DojoStubTemplateMissing"
    return 0
  fi

  reclaim_or_pointer() {
    local src="$1" dest="$2" label="$3" stub_name="$4"
    [[ -n "$src" && -d "$src" && -d "$dest" ]] || return 0
    # Refuse reclaim outside local FIELD unless forced
    if [[ "$src" != "$FIELD_HOME"* ]]; then
      if [[ "${FORCE_JBEAR_RECLAIM:-0}" != "1" ]]; then
        hold "HOLD.ReclaimSkippedNonFieldSource label=$label path=$src (not under $FIELD_HOME)"
        return 0
      fi
    fi
    local src_pwd dest_pwd
    src_pwd="$(cd "$src" && pwd)"
    dest_pwd="$(cd "$dest" && pwd)"
    if [[ "$src_pwd" == "$dest_pwd" ]]; then
      hold "HOLD.ReclaimSamePath label=$label — src is already SOMA dest"
      return 0
    fi
    local before_human
    before_human="$(du -sh "$src" 2>/dev/null | awk '{print $1}')"
    if [[ "${MOVE_MODE:-pointer}" == "replace" ]]; then
      local BACKUP
      BACKUP="$FIELD_HOME/FIELD-ANDROID-BACKUPS/${stub_name}-pre-soma-${TS}"
      mkdir -p "$FIELD_HOME/FIELD-ANDROID-BACKUPS"
      mv "$src" "$BACKUP"
      mkdir -p "$src"
      {
        echo "# $label — MOVED to Sovereign SOMA Field"
        echo
        echo "Local FIELD desk reclaimed this path so Mac Studio DOJO can free space."
        echo
        echo "## New home"
        echo
        echo '```text'
        echo "nexus-infinity/Field-NixOS-SOMA"
        echo "  ${dest#"$SOMA_CLONE"/}"
        echo '```'
        echo
        echo "Backup of former tree: $BACKUP"
        echo "Residence: teal SOMA · build distance-built · GitHub is durable home"
        echo
        echo "See suite/android/migration/DOJO_STUB_README.md in the SOMA repo."
      } >"$src/README.md"
      echo "RECLAIMED $label size_was=$before_human backup=$BACKUP stub=$src" | tee -a "$RECEIPT_DIR/RECLAIM_${TS}.txt"
    else
      cp "$TEMPLATE" "$src/MOVED_TO_SOMA_SUITE.md"
      echo "POINTER $label size_still_local=$before_human path=$src (MOVE_MODE=replace to reclaim disk)" | tee -a "$RECEIPT_DIR/RECLAIM_${TS}.txt"
      hold "HOLD.DojoDiskReclaimPending label=$label size=$before_human — still on Studio until MOVE_MODE=replace"
    fi
  }

  : >"$RECEIPT_DIR/RECLAIM_${TS}.txt"
  reclaim_or_pointer "$KITT_SRC" \
    "$SOMA_CLONE/suite/android/apps/kitt-arkadas-android" \
    "KITT" "kitt-arkadas-android"
  reclaim_or_pointer "$SONOC_SRC" \
    "$SOMA_CLONE/suite/android/lab/SonocScrewDriver" \
    "SONOC" "SonocScrewDriver"
  reclaim_or_pointer "$PULSE_ANDROID_SRC" \
    "$SOMA_CLONE/suite/android/apps/PULSE-Android" \
    "PULSE-Android" "PULSE-Android"

  if [[ "${MOVE_MODE:-pointer}" != "replace" ]]; then
    log "Space note: sync alone does NOT free disk (two copies). After SOMA PR merge + verify:"
    log "  MOVE_MODE=replace ./suite/android/migration/studio_android_to_soma_weaver.sh"
  fi
}

stage_la() {
  log "=== La — feedback / git status in SOMA ==="
  cd "$SOMA_CLONE"
  # Refresh HOLD register note from this cycle
  if [[ -f suite/android/UNKNOWN_HOLD_REGISTER.md ]]; then
    {
      echo ""
      echo "## Studio weaver cycle $TS"
      echo ""
      echo "| Pin | State | Note |"
      echo "|-----|-------|------|"
        echo "| HOLD.MacStudioFsUnreachableFromCloudSeat | CLOSED for this cycle | Ran on $(hostname) as $(whoami); local FIELD=$FIELD_HOME |"
      if [[ -n "$KITT_SRC" ]]; then
        echo "| HOLD.KittLocalReWitness | CLOSED | path=$KITT_SRC |"
      else
        echo "| HOLD.KittLocalReWitness | OPEN | HOLD.KittSourceMissing under /Users/field |"
      fi
      if [[ -n "$SONOC_SRC" ]]; then
        if [[ "$SONOC_SRC" == "$JBEAR_HOME"* ]]; then
          echo "| HOLD.SonocLocalReWitness | OPEN→leftover | found under jbear (NOT FIELD): $SONOC_SRC |"
        else
          echo "| HOLD.SonocLocalReWitness | CLOSED | path=$SONOC_SRC (FIELD desk) |"
        fi
      else
        echo "| HOLD.SonocLocalReWitness | OPEN | not under /Users/field |"
      fi
      if [[ -n "$PULSE_ANDROID_SRC" ]]; then
        echo "| Unknown.PulseAndroidLocalRecovery | OPEN→witnessed | FIELD local=$PULSE_ANDROID_SRC; GitHub still CONFIRMED_ABSENT |"
      fi
    } >> suite/android/UNKNOWN_HOLD_REGISTER.md
  fi

  git status -sb | tee "$RECEIPT_DIR/SOMA_GIT_STATUS_${TS}.txt"
  git add suite/android
  if git diff --cached --quiet; then
    log "No staged changes (maybe already synced or nothing PRESENT)."
  else
    git commit -m "$(cat <<'EOF'
feat(suite/android): ingest Mac Studio Android estate into SOMA Suite

PRESENT units synced by studio_android_to_soma_weaver (soft HOLD on absents).
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
    echo "moved_any: $MOVED_ANY"
    echo "hold_any: $HOLD_ANY"
    echo "KITT_SRC=${KITT_SRC:-ABSENT}"
    echo "SONOC_SRC=${SONOC_SRC:-ABSENT}"
    echo "PULSE_ANDROID_SRC=${PULSE_ANDROID_SRC:-ABSENT}"
    echo "next_ground:"
    echo "  - open/merge PR for $BRANCH on Field-NixOS-SOMA"
    echo "  - if KITT still ABSENT: search under /Users/field (Time Machine / external) — jbear is NOT local FIELD"
    echo "  - space: MOVE_MODE=replace after PR merge frees FIELD local trees (DOJO reclaim intention)"
    echo "  - do NOT delete ~/Library/Android SDK cache without separate receipt (Unknown.AndroidSdkNecessityVsCache)"
    echo "matrix: lines remain open; do not claim DOJO freed until RECLAIM_* receipt with MOVE_MODE=replace"
  } | tee "$RECEIPT_DIR/NEW_GROUND_${TS}.txt"
  log "DONE weaver cycle. Receipts in $RECEIPT_DIR"
  if [[ "$HOLD_ANY" -eq 1 ]]; then
    log "NOTE: one or more HOLDs — see $RECEIPT_DIR/HOLDS_${TS}.txt (cycle still completed)"
  fi
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
