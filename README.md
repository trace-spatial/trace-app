# Trace

**Trace detects interruptions and physically guides users back to what they were doing.**

It is built for people with early cognitive impairment who lose independence when interruptions leave them stuck.

---

## What Trace Is

Trace is a **cognitive accessibility system**, not a reminder app and not a productivity tool.

For people with early cognitive impairment (early-stage dementia, ADHD-related executive dysfunction, post-illness cognitive decline), an interruption can cause a complete loss of continuity. The person is not distracted — they are **unable to resume independently**.

Trace exists for that exact moment.

It does not tell users *what* to do.  
It does not store routines or schedules.  
It **detects when functioning breaks** and **guides the user back to the point where continuity was lost**, allowing natural recovery.

---

## What Trace Does

When a user becomes stuck after an interruption, Trace:

1. Detects behavioral signals that indicate loss of continuity  
2. Uses **Azure AI** to reason over recent interruption patterns  
3. Determines which interruption most likely caused the breakdown  
4. Physically guides the user back toward that moment  
5. Confirms whether independence is restored

The goal is not recall.  
The goal is **restoration of functioning**.

---

## User Experience (High Level)

- The user opens Trace when they feel stuck
- The system evaluates whether guidance is appropriate
- If actionable, Trace begins guidance
- A directional anchor appears, adjusting as the user moves
- Subtle haptics reinforce proximity to the interruption point
- The system verifies whether the user can continue independently

No typing.  
No explanation required.  
One action at a time.

---

## Architecture Overview

┌────────────────────────────────────────────────────┐
│                   USER INTERFACE                   │
│  React Native + Expo + TypeScript                  │
│                                                    │
│  • System-led evaluation state                     │
│  • Physical guidance (direction + haptics)         │
│  • Calibration and resolution confirmation         │
└──────────┬─────────────────────────────────────────┘
           │ Secure, minimal event stream
┌──────────┴────────────────────────────────────────┐
│              AZURE AI (CORE INTELLIGENCE)          │
│                                                    │
│  Azure OpenAI (GPT-4o)                              │
│  • Interruption reasoning                          │
│  • Confidence assessment                           │
│  • Adaptive guidance strategy                      │
│                                                    │
│  Azure AI Foundry                                  │
│  • Model training and refinement                   │
│  • Synthetic data generation                       │
│                                                    │
│  Azure Blob Storage                                │
│  • Model distribution                              │
│  • Versioned intelligence updates                  │
└──────────┬────────────────────────────────────────┘
           │ Device-level execution
┌──────────┴────────────────────────────────────────┐
│               ON-DEVICE ENGINES                    │
│                                                    │
│  IMU Engine (Rust)                                 │
│  • Processes accelerometer, gyroscope, compass    │
│  • Detects interruption events                    │
│                                                    │
│  Zone Mapper (Rust)                                │
│  • Maintains short-lived spatial anchors           │
│  • Tracks transitions, not maps                    │
│                                                    │
│  CEBE-X Runtime (ONNX)                              │
│  • Executes distilled ranking model                │
│  • Produces guidance-ready signals                 │
└────────────────────────────────────────────────────┘

**Important:** Azure AI is not optional. Without Azure, Trace cannot reason, adapt, or improve. The on-device engines execute guidance, but **intelligence lives in Azure**.

---

## What Trace Detects

Trace does not guess intent. It detects **interruptions that correlate with loss of functioning**:

| Signal | Meaning |
|------|--------|
| Phone pickup / drop | External interruption |
| Abrupt stop | Breakdown in action flow |
| Reversal or pacing | Failed continuation |
| Transport transition | Context boundary crossed |
| Prolonged stillness | Freeze response |
| Repeated micro-movements | Searching without recall |

These signals are evaluated together, not in isolation.

---

## How Trace Works (End-to-End)

### 1. Permissions

Trace requests:
- Motion sensor access
- Foreground activity awareness

No continuous recording. No background audio. No camera.

---

### 2. Event Detection (On Device)

The IMU Engine detects interruption events in real time using efficient Rust pipelines.

Events are summarized into compact representations.

---

### 3. Azure Reasoning (Required)

When guidance is requested:

- Recent interruption events are sent to Azure AI
- Azure OpenAI reasons over disruption patterns
- The system determines:
  - Whether guidance is appropriate
  - Which interruption caused loss of continuity
  - How guidance should be delivered

This step **cannot run locally**.

---

### 4. Physical Guidance

Trace guides the user back using:
- Directional anchor
- Confidence-adjusted feedback
- Sensory cues (visual + haptic)

The system adapts as the user moves.

---

### 5. Calibration

Trace verifies outcome:
- **“Yes, I can continue”**
- **“No, still stuck”**

This signal improves future reasoning.

---

## Project Structure

trace-app/
├── app/                    # User-facing screens
│   ├── index.tsx           # System evaluation + guidance entry
│   ├── guidance.tsx        # Physical guidance UI
│   └── calibration.tsx     # Outcome confirmation
│
├── _components/
│   ├── DirectionAnchor.tsx
│   ├── ConfidenceRing.tsx
│   └── SystemStatusText.tsx
│
├── _services/
│   ├── azureReasoning.ts   # Azure OpenAI interface
│   ├── guidanceEngine.ts  # Direction + haptics
│   └── permissions.ts
│
├── _state/
│   └── traceStore.ts
│
├── trace-sensing-engine/   # IMU Engine (Rust)
├── trace-zone-mapper/      # Zone Mapper (Rust)
├── trace-cebe-x-engine/    # CEBE-X Runtime (ONNX)
│   ├── BUILD_PLAN.md
└── README.md

---

## Azure Services Used (Required)

- **Azure OpenAI (GPT-4o)** Core interruption reasoning and adaptive guidance

- **Azure AI Foundry** Training, refinement, and synthetic data generation

- **Azure Blob Storage** Model distribution and versioning

Trace is not functional without Azure AI.

---

## Design Philosophy

1. **Assistive, not prescriptive** Trace guides. It never commands.

2. **System-led interaction** Users are not asked to explain failure.

3. **Minimal cognitive load** One action. One direction.

4. **Probabilistic honesty** Trace may decline to guide when confidence is low.

5. **Independence first** Success is measured by resumed functioning.

---

## Privacy & Trust

- Only summarized interruption data is sent to Azure
- No raw sensor streams are stored
- No audio or camera usage
- Azure processing is stateless and transient

Trace is designed for **medical-adjacent trust**, not consumer surveillance.

---

## Documentation

- [BUILD_PLAN.md](BUILD_PLAN.md) — Build and deployment
- [ARCHITECTURE.md](ARCHITECTURE.md) — Technical deep dive
- Engine READMEs for implementation details

---

Trace exists to restore independence when interruptions break daily functioning.
