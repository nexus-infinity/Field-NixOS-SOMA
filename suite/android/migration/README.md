# Migration weaver — Android → SOMA Suite

## Intention

Move Mac Studio Android estate into `Field-NixOS-SOMA/suite/android/` without collapsing Mandela matrix lines into a fake “done.”

## Do–Re–Mi (one shot on green desk)

```bash
# On Mac Studio Cursor / Terminal
git clone https://github.com/nexus-infinity/Field-NixOS-SOMA.git ~/FIELD-SOMA-WORK/Field-NixOS-SOMA
# after suite-home PR is on main, or checkout the suite-home branch:
cd ~/FIELD-SOMA-WORK/Field-NixOS-SOMA
git fetch && git checkout cursor/soma-android-suite-home-684b   # or main once merged
chmod +x suite/android/migration/studio_android_to_soma_weaver.sh

# First pass: sync into SOMA + leave pointer (keeps DOJO copy)
./suite/android/migration/studio_android_to_soma_weaver.sh

# After PR merged + backup verified — optional replace DOJO tree with stub only:
MOVE_MODE=replace ./suite/android/migration/studio_android_to_soma_weaver.sh
```

Dry run:

```bash
DRY_RUN=1 ./suite/android/migration/studio_android_to_soma_weaver.sh
```

## What cloud seat already did

- Seated `suite/android/` home + AGENTS + HOLD register on GitHub branch
- Wrote this weaver (cannot execute Mac half from cloud)

## What remains open until Studio weaver runs

See `../UNKNOWN_HOLD_REGISTER.md` — especially `HOLD.MacStudioFsUnreachableFromCloudSeat`.
