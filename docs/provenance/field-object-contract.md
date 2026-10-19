# FIELD Object Contract v1.0

**Cross-body reconciliation layer for DOJO ↔ SOMA temporal accountability**

## Purpose

Define a minimal, stable contract for FIELD objects, observations, claims, admissions, actions, and outcomes that preserves epistemic state through time and allows lineage reconstruction without rewriting history.

## Foundational principle

> **No present truth may rewrite past epistemic state.**

A later correction can supersede a claim for present operation, but it must not make an earlier action appear to have been based on information that was not yet known or authorised.

## Core entity types

### 1. FIELD Object (stable)

A stable, addressable entity in the FIELD whose state may be observed and contested but whose identity persists.

```typescript
interface FieldObject {
  object_id: string;           // Stable identifier (UUID or content-addressed)
  object_type: string;         // e.g., "appointment", "task", "contact"
  created_at: ISO8601;
  canonical_source?: string;   // Repository/authority that owns this object
  metadata: Record<string, unknown>;
}
```

**Examples**: An appointment, a file, a configuration value, a person's contact details.

**Key property**: The object_id does not change when observations about it conflict.

---

### 2. Observation (immutable, timestamped)

A claim about a FIELD object at a specific time, from a specific source, with specific provenance.

```typescript
interface Observation {
  observation_id: string;      // Unique, immutable ID
  object_id: string;           // References FieldObject
  observer: string;            // Agent/service/user that made observation
  observed_at: ISO8601;
  source: {
    type: "email" | "calendar" | "manual" | "sensor" | "inference";
    source_id: string;         // Unique identifier for the source artifact
    hash?: string;             // Content hash of source (if available)
  };
  claims: Claim[];             // One or more claims about object attributes
  provenance: {
    baton_id?: string;         // Link to SOMA baton if part of handoff
    previous_observation_id?: string;  // Supersedes relationship
    authority_level: "witnessed" | "inferred" | "reported" | "disputed";
  };
}

interface Claim {
  attribute: string;           // e.g., "start_time", "location", "status"
  value: unknown;
  confidence?: number;         // 0.0-1.0
}
```

**Examples**:
- Observation A: Email says appointment is 10:30
- Observation B: Calendar says appointment is 11:00
- Observation C: User manually corrected time to 10:30

**Key property**: Observations are immutable. Conflicts create multiple observations, not overwrites.

---

### 3. Admission (operative truth at a moment)

The system's acceptance of a specific observation as the operative truth for decision-making, with recorded authority and justification.

```typescript
interface Admission {
  admission_id: string;
  object_id: string;
  observation_id: string;      // Which observation was admitted
  admitted_at: ISO8601;
  admitted_by: string;         // Authority that made admission decision
  authority: {
    type: "human_override" | "system_rule" | "consensus" | "default_precedence";
    justification: string;
    policy_ref?: string;       // Link to policy document if applicable
  };
  supersedes?: string[];       // admission_ids this replaces
  disputed_observations?: string[];  // observation_ids known but not admitted
}
```

**Examples**:
- System admits Observation A (email 10:30) over Observation B (calendar 11:00) because email arrived first and no override policy exists
- Human explicitly overrides and admits Observation B, creating new admission that supersedes the first

**Key property**: Admissions are the decision ledger. They record *which* observation was chosen and *why*, enabling later reconstruction.

---

### 4. Action (issued against admitted state)

A system action taken based on the operative truth at the time, with explicit reference to which admission(s) informed it.

```typescript
interface Action {
  action_id: string;
  action_type: string;         // e.g., "send_reminder", "update_record", "trigger_workflow"
  issued_at: ISO8601;
  issued_by: string;           // Agent/service that issued action
  based_on: {
    admissions: string[];      // admission_ids that informed this decision
    context: string;           // Brief explanation of why action was taken
  };
  parameters: Record<string, unknown>;
  target?: {
    object_id: string;
    service: string;
  };
}
```

**Examples**:
- Action: Send reminder for appointment at 10:30, based on admission_id=abc123
- Action: Update calendar to reflect corrected time, based on admission_id=def456

**Key property**: Actions carry forward the epistemic justification chain. "I did X because admission Y was operative, which chose observation Z."

---

### 5. Outcome (witnessed result)

The observed result of an action, which may succeed, fail, or be indeterminate.

```typescript
interface Outcome {
  outcome_id: string;
  action_id: string;
  witnessed_at: ISO8601;
  witnessed_by: string;        // Observer that recorded outcome
  status: "success" | "failure" | "partial" | "unknown";
  evidence: {
    type: "receipt" | "log_entry" | "state_change" | "error" | "timeout";
    content: unknown;
    hash?: string;
  };
  semantic_result?: {
    description: string;       // Human-readable result
    verified: boolean;         // Whether result was independently verified
  };
}
```

**Examples**:
- Outcome: Reminder delivered successfully (email receipt, timestamp)
- Outcome: Reminder failed (SMTP error, no delivery)
- Outcome: Unknown (timeout, no receipt)

**Key property**: Outcomes close the loop. They prove what actually happened, not just what was intended.

---

## Temporal accountability invariant

At any future time T, given:
- A FIELD object O
- An action A taken at time T₀
- A set of observations {Obs₁, Obs₂, ...} known at T₀
- An admission Adm chosen at T₀
- An outcome Out witnessed at T₁

The system MUST be able to reconstruct:

1. **What was known**: All observations about O that existed at T₀
2. **What was admitted**: Which observation was chosen as operative truth and why
3. **What was done**: The action taken and its explicit dependence on the admission
4. **What happened**: The witnessed outcome
5. **Why it was rational**: The decision chain remains valid even if a later observation at T₂ contradicts Adm

**This is the test**: A later challenge at T₂ can dispute the admission and create a new one going forward, but it cannot make the action at T₀ appear irrational given the state of knowledge at T₀.

---

## Storage conventions

### SOMA manifestation evidence log

Location: `/var/log/manifestation-evidence.jsonl`

Event types:
- `observation_recorded`: Log new observation
- `admission_made`: Log admission decision
- `action_issued`: Log action with admission references
- `action_outcome`: Log witnessed outcome

Each event includes:
- ISO8601 timestamp
- Event type
- Payload (observation/admission/action/outcome object)
- Previous event hash (for chain integrity)
- Content hash (of this event)

### DOJO OBI-WAN observation corpus

Location: To be defined in DOJO repository

Observations indexed by:
- `observation_id` (primary)
- `object_id` (secondary, allows finding all observations of an object)
- `observed_at` (temporal ordering)

Admissions stored separately with references back to observations.

---

## Cross-body handoff via baton

When SOMA passes control to DOJO (or vice versa) via baton:

```typescript
interface BatonHandoff {
  baton_id: string;
  // ... existing baton fields from baton-lifecycle.md
  
  // NEW: Epistemic state attachment
  epistemic_state: {
    objects: FieldObject[];
    observations: Observation[];
    admissions: Admission[];
    pending_observations?: Observation[];  // Known but not yet admitted
  };
}
```

The receiving body:
1. Accepts the baton with its epistemic state
2. May add new observations
3. May create new admissions (with justification)
4. Issues actions based on its admissions
5. Witnesses outcomes
6. Returns baton with updated epistemic state

**Key property**: The epistemic state travels with the baton, preserving the timeline across bodies.

---

## Acceptance test: Appointment fixture

**Scenario**: Two conflicting appointment time observations, followed by action, followed by later challenge.

```
T0: Observation A recorded (email: 10:30)
T1: Observation B recorded (calendar: 11:00)
T2: Admission made (10:30 accepted, authority: "first-source-precedence")
T3: Action issued (send reminder for 10:30, based_on: admission_T2)
T4: Outcome witnessed (reminder delivered, receipt_id: xyz)
T5: Late correction (human overrides, admits calendar time 11:00)
```

**Reconstruction requirement at T5**:

The system must show:
- At T3, both observations existed
- Admission at T2 chose 10:30 with documented justification
- Action at T3 correctly referenced admission_T2
- Outcome at T4 proves reminder was sent
- New admission at T5 supersedes T2 going forward
- **The action at T3 remains justified by the state at T2**

**Pass condition**: Full lineage is reconstructible without claiming T3 "should have known" T5's information.

---

## Implementation notes

### For SOMA

- Extend `manifestation-evidence.nix` to log observations/admissions/actions/outcomes
- Reference this contract in chakra services that make decisions
- Pass epistemic state in batons

### For DOJO

- Store observations in OBI-WAN corpus with this schema
- Implement admission ledger (location TBD)
- Reference admissions when HomeFIELD agents take actions

### Shared validation

Create a `field-contract-validator` tool that:
- Parses both SOMA and DOJO logs
- Reconstructs epistemic state at any timestamp
- Verifies temporal accountability invariant
- Runs the appointment fixture as regression test

---

## References

- [baton-lifecycle.md](baton-lifecycle.md) — SOMA baton provenance
- [field-governance.md](../runbooks/field-governance.md) — Observer/Architect/Weaver authority boundaries
- [observer-architect-weaver.md](../ontology/observer-architect-weaver.md) — Role definitions
- DOJO: `FIELD_LAWS.py`, `FIELD_COHABITATION_PROTOCOL.md`, `CURSOR_CLOUD_LOCAL_AUTHORITY_RULE_V1.md`

---

**Version**: 1.0  
**Status**: DRAFT — awaiting cross-body acceptance test  
**Next milestone**: Implement appointment fixture end-to-end across SOMA manifestation evidence and DOJO OBI-WAN observation corpus
