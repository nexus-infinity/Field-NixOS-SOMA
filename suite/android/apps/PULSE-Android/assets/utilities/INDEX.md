# Utility Photo Index — 10 Watts Parade, Mount Eliza

Photos surveying solar, gas, electrical, and hot water infrastructure.
Copied from iPhone → Downloads 27 Mar 2026.

---

## Solar Inverter — SOFAR Solar (near front door, behind wooden screen)

| File | Subject | Key Findings |
|------|---------|--------------|
| IMG_1077.jpeg | SOFAR Solar inverter — front plate | Brand: **SOFAR Solar**. Model readable on plate. ~20kW class. |
| IMG_1078.jpeg | Secondary unit + Air Switch | Battery charge controller / AC coupling unit adjacent to inverter |
| IMG_1079.jpeg | Bottom connection panel | BAT1, BAT2, PV1, V2+ inputs — confirms **hybrid** (battery-ready). AC LOAD output. |
| IMG_1080.jpeg | LCD display — energy stats | ~5.76 kWh shown. Normal operation. |
| IMG_1081.jpeg | LCD — Grid Output | R/S/T phases 233–240V, 49.98Hz — **3-phase confirmed**, standard AU grid |
| IMG_1082.jpeg | LCD — Grid Info | R=1.05kW, S=1.30kW, T=1.71kW EXPORT — ~4kW live export at time of photo |
| IMG_1083.jpeg | Inverter side angle | Wiring detail, RJ45 comms port visible |
| IMG_1084.jpeg | Inverter wiring detail | Cable runs + conduit |
| IMG_1085.jpeg | Additional inverter angle | |
| IMG_1086.jpeg | Inverter top/conduit | Conduit labelled "SOLAR DC" |
| IMG_1087.jpeg | Inverter rear/mounting | |
| IMG_1088.jpeg | Gas meter area (context) | North wall — gas meter + electrical service entry in same bay |
| IMG_1089.jpeg | Gas/electrical service entry | North wall connections overview |
| IMG_1090.jpeg | Electrical service entry detail | |

**SOFAR Solar PULSE Integration:**
- Comms: Modbus RS485 via RJ45 port, OR SolarmanV5 over LAN (WiFi dongle)
- Python library: `pysolarmanv5` — no cloud required
- Confirm: WiFi dongle presence not yet verified in photos
- Capacity: ~21 kVA (3-phase), battery-ready (BAT1/BAT2 slots)

---

## Gas Meter — Landis+Gyr (north wall, service entry bay)

| File | Subject | Key Findings |
|------|---------|--------------|
| IMG_1111.jpeg | Gas meter — front | Brand: **Landis+Gyr**. Large grey diaphragm meter body. Blue certification label. |
| IMG_1112.jpeg | Gas meter — assembly | Yellow safety cap (pressure test), red cap (valve), standard AU gas fittings |
| IMG_1113.jpeg | Gas meter — reading | ~026312890 MJ cumulative (confirm units: MJ or m³) |
| IMG_1115.jpeg | North wall overview | Gas + electrical + Telstra/NBN entry on same north wall |

**Landis+Gyr PULSE Integration:**
- No smart interface visible on meter
- Options: (1) request smart meter from retailer, (2) install pulse counter on meter pulse output
- Current reading: manual read only

---

## Back Garden / Terrace (garden survey)

| File | Subject | Key Findings |
|------|---------|--------------|
| IMG_0872.jpeg | Back garden overview | AC unit visible left edge, overgrown lower garden |
| IMG_0873.jpeg | Garden / fence area | Brick boundary fence, terrace paving |
| IMG_0874.jpeg | Back terrace detail | Kitchen-family room terrace area |
| IMG_0875.jpeg | Clothes line area | Clothes line + back fence infrastructure |
| IMG_0876.jpeg | Hot water unit on back fence | **Gas HWU** on back fence ~behind laundry — candidate for heat pump replacement |
| IMG_0877.jpeg | AC / back wall | AC unit on back wall of house |

**Hot Water Unit (IMG_0876):**
- Type: Gas storage (visible on back fence)
- Location: Back fence, approximately behind laundry
- Make/model: Not yet confirmed from photo (too distant — needs close-up)
- Replacement candidate: Electric/heat pump HWU — government rebates available

---

## Electricity Meter
- Location: North wall service entry bay (same bay as gas meter)
- Make/model: **Not yet photographed clearly**
- Action: Take close-up of meter + any serial/model label

---

## WiFi Dongle on SOFAR Inverter
- Not visible in current photos
- Action: Check RJ45 / USB port on inverter for dongle presence

---

## Summary: Equipment Confirmed

| System | Brand | Model/Type | PULSE Comms |
|--------|-------|-----------|-------------|
| Solar Inverter | SOFAR Solar | Hybrid 3-phase ~21kVA, BAT-ready | Modbus RS485 or SolarmanV5/LAN |
| Gas Meter | Landis+Gyr | Diaphragm, large industrial | None (manual / pulse counter needed) |
| Hot Water Unit | Unknown | Gas storage, back fence | None identified yet |
| AC Unit | Unknown | Split system, back wall | Unknown (likely IR / WiFi) |
