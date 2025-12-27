# Trace — Mobile App Architecture & System README

**“The moment you put it down is gone — Trace helps you find it anyway.”**

Trace is a mobile application that helps people recover lost items by reasoning about **lost moments**, not by tracking objects or locations.

This repository documents the **app-level system**: how the UI, on-device engines, and optional Azure services bind together into a single coherent product.

This is not a marketing overview.  
This is an architectural and behavioral specification intended for judges, engineers, and reviewers.

---

## What Trace Is (in one sentence)

Trace helps users recover objects **after the moment of placement is irreversibly gone**, by reasoning locally about interruption behavior and guiding a human search — without tracking, surveillance, or continuous cloud dependence.

---

## Core Design Guarantees

Trace enforces the following guarantees by construction:

- No object tracking
- No GPS or maps
- No cameras or microphones
- No continuous cloud processing
- No real-time intervention
- No certainty claims

All intelligence is **on-device**.  
The cloud is used **only** when humans collaborate.

---

## High-Level System Overview

Trace is composed of four independent layers:

1. **IMU Movement Engine** — captures interruption evidence  
2. **Zone Mapper** — preserves stable place identities  
3. **CEBE-X Engine** — ranks where attention most likely broke  
4. **Azure Secure Boundary (optional)** — enables human-assisted collaboration  

The UI never touches raw sensor data or models.  
It reacts only to **high-level states** emitted by these layers.

---

## On-Device Architecture (No Local Networking)

All Trace engines run **inside the mobile process** as libraries.

There are:
- no local HTTP servers
- no IPC services
- no localhost calls
- no background daemons beyond OS sensor scheduling

Each engine is linked as a **library module**, not as a service.

Data flows strictly in-memory via typed interfaces.

---

## IMU Movement Engine

### Responsibility

The IMU engine answers one question only:

> *When did normal motion break?*

It captures **interruption evidence**, not intent or location.

### Inputs

- Accelerometer (x, y, z)
- Gyroscope (x, y, z)
- Monotonic timestamps
- Optional step detector

No GPS.  
No Wi-Fi scanning here.  
No storage of raw streams.

### Processing

- Gravity separation
- Orientation normalization
- Motion segmentation
- Transition detection (pause, turn, hesitation)
- Evidence window assembly

### Output

The engine emits short-lived `MotionEvidenceWindow` objects containing:

- interruption candidates
- confidence
- validity state

Raw IMU samples never leave the engine.

---

## Zone Mapper

### Responsibility

Zone Mapper preserves **place identity consistency**, not geometry.

It answers:

- “Have I been in a similar place before?”
- “How are these places connected by movement?”

### Inputs

- Movement episodes from IMU engine
- Optional weak fingerprints (Wi-Fi, magnetometer) at transitions

Missing fingerprints are valid.

### Internal Model

- Relative belief-space coordinates
- Deterministic zone clustering
- Stability scoring
- Automatic pruning

Zones are **hypotheses**, not rooms or coordinates.

### Output

Zone Mapper exposes a single public surface:

- `get_zone_graph()`

This graph is local, private, and non-exported unless explicitly shared.

---

## CEBE-X Reasoning Engine

### Responsibility

CEBE-X performs **post-hoc reasoning**.

It never runs in real time.  
It never claims certainty.

It answers:

> *Given lost moments and known zones, where does it make sense to search first?*

### Inputs

- Interruption evidence (from IMU)
- Zone graph (from Zone Mapper)
- User-declared loss intent (e.g. “keys”)

### Processing

- Rule-based segmentation
- Interpretable feature extraction
- Lightweight neural weighting (frozen, offline-trained)
- Probability normalization

### Output

- Ranked zones
- Confidence values
- Human-readable explanations

CEBE-X produces **search order**, not predictions.

---

## UI Layer

### Visual Language

The UI is intentionally minimal.

- One primary visual: **the spiral**
- No maps
- No dashboards
- No browsing history
- No certainty language

The spiral represents:
- behavior trace
- system readiness
- share capability

### Primary States

1. **Listening**
   - App is active
   - No UI noise
   - No data shown

2. **Guidance**
   - Arrow appears inside spiral
   - Indicates next plausible search direction
   - Updates as the user moves

3. **Check Point**
   - User is asked:
     - Found it
     - Not here
     - Not sure

4. **Resolution**
   - Success acknowledged quietly
   - No gamification
   - No reinforcement loops

---

## User Flow

1. User loses an item
2. User opens Trace
3. User enters what was lost
4. Trace enters guidance mode
5. User follows arrow
6. User checks a place
7. User confirms result
8. Trace adapts or resolves
9. Session ends

No onboarding dashboards.  
No training phases.  
No progress bars.

---

## Optional Secure Collaboration (Azure)

### When It Is Used

Only when:
- the user explicitly shares a trace
- another human is physically present elsewhere

### Services Used

- Azure Confidential Virtual Machine (TEE)
- Azure App Service (free tier)
- Azure Functions (consumption)

### What Happens

- Ranked search steps are encrypted on-device
- Sent into a confidential VM
- Forwarded to another device
- Human responses return
- Session expires
- VM can be shut down

### What Does Not Happen

- No IMU data leaves device
- No zone graphs persist
- No learning occurs
- No user identities are stored

Azure is a **trust boundary**, not an intelligence layer.

---

## Permissions Required

Trace requests the minimum permissions necessary:

- Motion sensors (accelerometer, gyroscope)
- Background activity recognition
- Optional network access (only for sharing)

Trace does **not** request:

- Location
- Camera
- Microphone
- Contacts
- Files
- Bluetooth tracking

---

## Safety & Anti-Cloning Guarantees

Trace is resistant to misuse by design:

- Engines require internal typed inputs
- No raw data export APIs exist
- No debug endpoints
- No model weights exposed
- No remote execution hooks

Cloning the UI without the engines yields nothing useful.

Cloning the engines without the UI yields uninterpretable evidence.

---

## Failure Behavior

Trace never fails silently.

If assumptions break:
- confidence is lowered
- guidance becomes conservative
- system may refuse to guide

Trace prefers **silence over misinformation**.

---

## What Trace Is Not

Trace is not:
- a tracker
- a locator
- a reminder
- a surveillance system
- a medical device
- a prevention tool

Trace exists **after** the moment is gone.

---

## Final Summary

Trace does not help you remember.

It accepts that the moment is gone.

It quietly remembers what you cannot —  
and guides you back without watching, judging, or interrupting.

This repository documents how that promise is enforced end to end.