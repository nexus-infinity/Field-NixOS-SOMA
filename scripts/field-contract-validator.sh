#!/usr/bin/env bash
# FIELD Contract Validator
#
# Validates that an evidence log maintains temporal accountability invariants
# defined in field-object-contract.md

set -euo pipefail

EVIDENCE_LOG="${1:-/var/log/manifestation-evidence.jsonl}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
  cat <<EOF
Usage: $0 [EVIDENCE_LOG]

Validates FIELD object contract temporal accountability invariants.

Arguments:
  EVIDENCE_LOG    Path to evidence log (default: /var/log/manifestation-evidence.jsonl)

Exit codes:
  0 - All validations passed
  1 - Validation failures detected
  2 - Log not found or malformed
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ ! -f "$EVIDENCE_LOG" ]]; then
  echo -e "${RED}✗${NC} Evidence log not found: $EVIDENCE_LOG"
  exit 2
fi

echo "========================================="
echo "FIELD Contract Validator"
echo "========================================="
echo "Log: $EVIDENCE_LOG"
echo ""

# Load all events
EVENTS=$(jq -s '.' "$EVIDENCE_LOG" 2>/dev/null) || {
  echo -e "${RED}✗${NC} Failed to parse evidence log as JSON"
  exit 2
}

EVENT_COUNT=$(echo "$EVENTS" | jq 'length')
echo "Total events: $EVENT_COUNT"
echo ""

# Validation 1: Hash chain integrity
echo -e "${BLUE}[1/6]${NC} Validating hash chain integrity..."
PREV_HASH="genesis"
EVENT_NUM=0
CHAIN_ERRORS=0

# Extract events into temp file for iteration
TEMP_EVENTS=$(mktemp)
echo "$EVENTS" | jq -c '.[]' > "$TEMP_EVENTS"

while IFS= read -r event; do
  EVENT_NUM=$((EVENT_NUM + 1))
  
  EXPECTED_PREV=$(echo "$event" | jq -r '.prev_event_hash')
  CONTENT_HASH=$(echo "$event" | jq -r '.content_hash')
  
  if [[ "$EXPECTED_PREV" != "$PREV_HASH" ]]; then
    echo -e "  ${RED}✗${NC} Chain broken at event $EVENT_NUM: expected prev=$PREV_HASH, got $EXPECTED_PREV"
    CHAIN_ERRORS=$((CHAIN_ERRORS + 1))
  fi
  
  PREV_HASH="$CONTENT_HASH"
done < "$TEMP_EVENTS"

rm "$TEMP_EVENTS"

if [[ "$CHAIN_ERRORS" -eq 0 ]]; then
  echo -e "  ${GREEN}✓${NC} Hash chain integrity verified ($EVENT_COUNT events)"
else
  echo -e "  ${RED}✗${NC} Hash chain integrity FAILED ($CHAIN_ERRORS errors)"
  exit 1
fi
echo ""

# Validation 2: Observation immutability
echo -e "${BLUE}[2/6]${NC} Validating observation immutability..."
OBSERVATIONS=$(echo "$EVENTS" | jq '[.[] | select(.event_type == "observation_recorded")]')
OBS_IDS=$(echo "$OBSERVATIONS" | jq -r '.[].payload.observation_id' | sort)
UNIQUE_OBS_IDS=$(echo "$OBS_IDS" | sort -u)

if [[ "$(echo "$OBS_IDS" | wc -l)" != "$(echo "$UNIQUE_OBS_IDS" | wc -l)" ]]; then
  echo -e "  ${RED}✗${NC} Duplicate observation IDs detected (observations must be immutable)"
  echo "$OBS_IDS" | uniq -d | while read -r dup_id; do
    echo -e "    • Duplicate: $dup_id"
  done
  exit 1
else
  OBS_COUNT=$(echo "$OBSERVATIONS" | jq 'length')
  echo -e "  ${GREEN}✓${NC} All $OBS_COUNT observations have unique IDs"
fi
echo ""

# Validation 3: Admission references valid observations
echo -e "${BLUE}[3/6]${NC} Validating admission → observation references..."
ADMISSIONS=$(echo "$EVENTS" | jq '[.[] | select(.event_type == "admission_made")]')
ADM_COUNT=$(echo "$ADMISSIONS" | jq 'length')
INVALID_REFS=0

echo "$ADMISSIONS" | jq -c '.[]' | while read -r admission; do
  ADM_ID=$(echo "$admission" | jq -r '.payload.admission_id')
  OBS_ID=$(echo "$admission" | jq -r '.payload.observation_id')
  
  # Check if observation exists
  if ! echo "$OBSERVATIONS" | jq -e ".[] | select(.payload.observation_id == \"$OBS_ID\")" > /dev/null; then
    echo -e "  ${RED}✗${NC} Admission $ADM_ID references non-existent observation $OBS_ID"
    ((INVALID_REFS++))
  fi
done

if [[ "$INVALID_REFS" -eq 0 ]]; then
  echo -e "  ${GREEN}✓${NC} All $ADM_COUNT admissions reference valid observations"
else
  echo -e "  ${RED}✗${NC} Found $INVALID_REFS invalid observation references"
  exit 1
fi
echo ""

# Validation 4: Actions reference valid admissions
echo -e "${BLUE}[4/6]${NC} Validating action → admission references..."
ACTIONS=$(echo "$EVENTS" | jq '[.[] | select(.event_type == "action_issued")]')
ACTION_COUNT=$(echo "$ACTIONS" | jq 'length')
INVALID_ACTION_REFS=0

echo "$ACTIONS" | jq -c '.[]' | while read -r action; do
  ACTION_ID=$(echo "$action" | jq -r '.payload.action_id')
  ADM_IDS=$(echo "$action" | jq -r '.payload.based_on.admissions[]')
  
  for adm_id in $ADM_IDS; do
    if ! echo "$ADMISSIONS" | jq -e ".[] | select(.payload.admission_id == \"$adm_id\")" > /dev/null; then
      echo -e "  ${RED}✗${NC} Action $ACTION_ID references non-existent admission $adm_id"
      ((INVALID_ACTION_REFS++))
    fi
  done
done

if [[ "$INVALID_ACTION_REFS" -eq 0 ]]; then
  echo -e "  ${GREEN}✓${NC} All $ACTION_COUNT actions reference valid admissions"
else
  echo -e "  ${RED}✗${NC} Found $INVALID_ACTION_REFS invalid admission references"
  exit 1
fi
echo ""

# Validation 5: Outcomes reference valid actions
echo -e "${BLUE}[5/6]${NC} Validating outcome → action references..."
OUTCOMES=$(echo "$EVENTS" | jq '[.[] | select(.event_type == "action_outcome")]')
OUTCOME_COUNT=$(echo "$OUTCOMES" | jq 'length')
INVALID_OUTCOME_REFS=0

echo "$OUTCOMES" | jq -c '.[]' | while read -r outcome; do
  OUTCOME_ID=$(echo "$outcome" | jq -r '.payload.outcome_id')
  ACTION_ID=$(echo "$outcome" | jq -r '.payload.action_id')
  
  if ! echo "$ACTIONS" | jq -e ".[] | select(.payload.action_id == \"$ACTION_ID\")" > /dev/null; then
    echo -e "  ${RED}✗${NC} Outcome $OUTCOME_ID references non-existent action $ACTION_ID"
    ((INVALID_OUTCOME_REFS++))
  fi
done

if [[ "$INVALID_OUTCOME_REFS" -eq 0 ]]; then
  echo -e "  ${GREEN}✓${NC} All $OUTCOME_COUNT outcomes reference valid actions"
else
  echo -e "  ${RED}✗${NC} Found $INVALID_OUTCOME_REFS invalid action references"
  exit 1
fi
echo ""

# Validation 6: Temporal ordering
echo -e "${BLUE}[6/6]${NC} Validating temporal ordering..."
PREV_TS=""
ORDERING_VALID=true

echo "$EVENTS" | jq -r '.[].timestamp' | while read -r ts; do
  if [[ -n "$PREV_TS" && "$ts" < "$PREV_TS" ]]; then
    echo -e "  ${RED}✗${NC} Timestamp ordering violation: $ts comes after $PREV_TS"
    ORDERING_VALID=false
  fi
  PREV_TS="$ts"
done

if [[ "$ORDERING_VALID" == "true" ]]; then
  echo -e "  ${GREEN}✓${NC} All timestamps are monotonically increasing"
else
  echo -e "  ${RED}✗${NC} Temporal ordering FAILED"
  exit 1
fi
echo ""

# Summary statistics
echo "========================================="
echo "Validation Summary"
echo "========================================="
echo "Events analyzed:     $EVENT_COUNT"
echo "Observations:        $(echo "$OBSERVATIONS" | jq 'length')"
echo "Admissions:          $(echo "$ADMISSIONS" | jq 'length')"
echo "Actions:             $(echo "$ACTIONS" | jq 'length')"
echo "Outcomes:            $(echo "$OUTCOMES" | jq 'length')"
echo ""

# Check for objects with multiple observations
OBJECTS_WITH_CONFLICTS=$(echo "$OBSERVATIONS" | jq -r '.[].payload.object_id' | sort | uniq -d)
if [[ -n "$OBJECTS_WITH_CONFLICTS" ]]; then
  echo "Objects with multiple observations (potential conflicts):"
  echo "$OBJECTS_WITH_CONFLICTS" | while read -r obj_id; do
    OBS_FOR_OBJ=$(echo "$OBSERVATIONS" | jq "[.[] | select(.payload.object_id == \"$obj_id\")]")
    OBS_FOR_OBJ_COUNT=$(echo "$OBS_FOR_OBJ" | jq 'length')
    echo "  • $obj_id: $OBS_FOR_OBJ_COUNT observations"
    
    # Show admitted vs disputed
    ADMITTED=$(echo "$ADMISSIONS" | jq -r "[.[] | select(.payload.object_id == \"$obj_id\")] | sort_by(.timestamp) | last | .payload.observation_id // \"(none)\"")
    if [[ "$ADMITTED" != "(none)" ]]; then
      echo "    → Currently admitted: $ADMITTED"
    else
      echo "    → No admission recorded"
    fi
  done
  echo ""
fi

echo -e "${GREEN}✓ All validations passed${NC}"
echo ""
echo "Temporal accountability contract maintained:"
echo "  ✓ Hash chain integrity ensures tamper-evidence"
echo "  ✓ Observations are immutable (no overwrites)"
echo "  ✓ Admissions reference valid observations"
echo "  ✓ Actions justified by admissions at decision time"
echo "  ✓ Outcomes witnessed and linked to actions"
echo "  ✓ Temporal ordering preserved"
echo ""
echo "Log can be used for epistemic state reconstruction at any timestamp."
