# SOMA Suite — Unknown / HOLD register

Matrix lines remain **OPEN**. Clearing a pin requires a receipt, not a narrative.

## Seat map (LOCKED)

| Seat | Path | Note |
|------|------|------|
| Local FIELD desk | `/Users/field/` | **This** is local FIELD on Mac Studio |
| `/Users/jbear/` | other account | **NOT** local FIELD — Klaus historical / leftovers only |

## Residence / identity

| Pin | State | Note |
|-----|-------|------|
| HOLD.SomaDistanceBuildPreserved | LOCKED | GitHub accurate; not in-OS studio |
| HOLD.SomaAsAppSkuCollapse | LOCKED | SOMA ≠ Android app |
| HOLD.DojoPathAndroidAffinity | OPEN | KITT historically under ◼︎DOJO (expect under `/Users/field`) |
| HOLD.PulseAsAppSkuCollapse | LOCKED | PULSE ≠ warehouse for Android |
| HOLD.SomaMatrixNotMapped | OPEN | Do not clear via Android moves alone |
| HOLD.JbearIsNotLocalField | LOCKED | Never treat `/Users/jbear` as FIELD desk |
| HOLD.DojoDiskReclaimPending | OPEN | Intention: SOMA home frees Studio DOJO space — clear only with `RECLAIM_*` after `MOVE_MODE=replace` |
| HOLD.SyncDoesNotFreeDisk | LOCKED | Phase-1 rsync doubles until replace; do not claim free space after weave alone |

## Migration / inventory

| Pin | State | Note |
|-----|-------|------|
| HOLD.MacStudioFsUnreachableFromCloudSeat | OPEN until Studio weaver runs | Cloud agent cannot ls `/Users/field` |
| HOLD.KittLocalReWitness | OPEN | Studio 2026-08-15T083118Z: ABSENT at `/Users/field/◼︎DOJO/kitt-arkadas-android` |
| HOLD.KittSourceMissing | OPEN | Soft HOLD — weaver continues without KITT |
| HOLD.SonocLocalReWitness | OPEN | Not under `/Users/field` yet; leftover seen under jbear AndroidStudioProjects (cross-account, not FIELD) |
| Unknown.KittGitRemote | OPEN | No public nexus-infinity kitt repo found 2026-08-15 |
| CONFIRMED_ABSENT.PulseAndroidRepo | CLOSED | GitHub 404 |
| Unknown.PulseAndroidLocalRecovery | OPEN→witnessed | FIELD PRESENT `/Users/field/StudioProjects/PULSE-Android` ~2.6G; local remote `nexus-infinity/PULSE-Android.git`; public API still 404 |
| HOLD.PulseAndroidGitlinkOnSoma | OPEN | Cycle 083735Z pushed mode 160000 — must re-weave as normal tree before reclaim |
| HOLD.KittSpecOnlyUnderJbear | OPEN | Spec only: `/Users/jbear/FIELD/◼︎DOJO/KITT_ARKADAS_ANDROID_SPEC.md` — not source |
| CONFIRMED_ABSENT.V0PulseWebRepo | CLOSED | GitHub 404 |
| Unknown.S22CurrentHubAppIdentity | OPEN | |
| Unknown.AndroidSdkNecessityVsCache | OPEN | FIELD PRESENT `/Users/field/Library/Android` ~7.1G |
| Unknown.OperatorDeskUser | WITNESSED | Weaver ran as Unix `field` on `macstudio.local` |

## SSH / topology

| Pin | State |
|-----|-------|
| HOLD.TrustedSSHPathUnseated | OPEN |
| Unknown.RemoteSomaIdentity | OPEN |
| Unknown.PulseProofRoute | OPEN |

## Pulse differentiation (do not flatten)

```text
FIELD.TICK · DOJO.PULSE · SOMA.PULSE · BRIDGE.PULSE
```

## Studio cycle notes

- **2026-08-15T083118Z** — Suite home applied+pushed (`cursor/soma-android-suite-home-684b`). Content weaver hard-failed on KITT (old script). Soft-HOLD weaver + FIELD=`/Users/field` lock shipped after this receipt.

## Studio weaver cycle 2026-08-15T084007Z

| Pin | State | Note |
|-----|-------|------|
| HOLD.MacStudioFsUnreachableFromCloudSeat | CLOSED for this cycle | Ran on macstudio.local as field; local FIELD=/Users/field |
| HOLD.KittLocalReWitness | OPEN | HOLD.KittSourceMissing under /Users/field |
| HOLD.SonocLocalReWitness | OPEN→leftover | found under jbear (NOT FIELD): /Users/jbear/AndroidStudioProjects/SonocScrewDriver |
| Unknown.PulseAndroidLocalRecovery | OPEN→witnessed | FIELD local=/Users/field/StudioProjects/PULSE-Android; GitHub still CONFIRMED_ABSENT |
