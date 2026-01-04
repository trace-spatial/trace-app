# Trace

Detects interruptions and physically guides users back to what they were doing.

Built for people with early cognitive impairment who lose independence when interruptions leave them stuck.

## What Trace Does

When you get interrupted and lose your train of thought, you ask:

> "Where was I?"

Trace listens to your motion—the way you walk, your hesitations, your turns—and identifies the exact moment your focus broke. It shows you that moment visually, with the places you were, so you can resume what you were doing.

No network required. No data leaves your device.

## Architecture

```
┌────────────────────────────────────────────────────┐
│              USER INTERFACE                        │
│  React Native + Expo + TypeScript                  │
│  ├─ Query: "Where was I?"                         │
│  ├─ Results: Visual timeline of disruptions       │
│  └─ Guidance: Where you were and why              │
└──────────┬─────────────────────────────────────────┘
           │
           │ FFI (fast, type-safe)
           │
┌──────────┴────────────────────────────────────────┐
│          OFFLINE RUST ENGINES                     │
│                                                   │
│  IMU Engine                                       │
│  • Processes: accel, gyro, compass               │
│  • Detects: motion patterns + disruptions        │
│  • Output: Binary wire format                    │
│        │                                          │
│        ├─→ Zone Mapper                           │
│        │   • Spatial index of locations         │
│        │   • Zone transitions + persistence     │
│        │                                         │
│        └─→ CEBE-X Engine                        │
│            • Ranks disruptions by relevance     │
│            • Scores: 0.0–1.0 confidence       │
└──────────────────────────────────────────────────┘
```

## What Trace Detects

Trace watches for moments when your behavior changes abruptly:

| Signal | Meaning | Weight |
|--------|---------|--------|
| Phone pickup | You got distracted | 0.9 |
| Transport change | You changed location mode | 0.8 |
| Searching behavior | You're looking for something | 0.75 |
| Abrupt halt | You stopped suddenly | 0.7 |
| Environment change | You entered/left a place | 0.65 |
| Extended stillness | You paused longer than usual | 0.6 |

When one of these happens, Trace stores it. When you ask "Where was I?", it shows you which moment was most likely your interruption point.

## How It Works

**1. Permission Setup**

Trace asks for motion sensor access on first launch. That's all it needs.

**2. Background Monitoring**

Your phone's motion processors collect accelerometer, gyroscope, and compass data. This runs continuously but uses minimal battery because it's in Rust—no garbage collection, no overhead.

**3. On-Device Processing**

The data flows through three Rust engines:
- **IMU Engine** detects disruption events in real-time
- **Zone Mapper** builds a spatial index of where you've been  
- **CEBE-X** ranks those events by relevance

All happens locally. Your data never leaves your device.

**4. User Query**

You ask: "Where was I 1 hour ago?"

Trace queries the stored disruptions from the last hour, ranks them by relevance (confidence score), and shows you a timeline.

**5. Guidance (Optional)**

If you enable Azure OpenAI, Trace can generate empathetic context:

> "You were at home. You paused what you were doing at 2:15pm when you got a notification."

## Project Structure

```
trace-app/
├── app/                    # User-facing screens (Expo Router)
│   ├── (tabs)/
│   │   ├── index.tsx      # Main query screen
│   │   └── explore.tsx    # Results timeline
│   ├── screens/           # Full screens
│   └── modal.tsx          # Dialogs
│
├── _components/            # UI components
│   ├── AIInput.tsx        # Query input
│   ├── BehavioralIndicator.tsx  # Motion feedback
│   └── ConfidenceBadge.tsx      # Confidence display
│
├── _utils/                # Business logic
│   ├── hooks/
│   │   ├── useInference.ts       # CEBE-X queries
│   │   ├── useGraph.ts           # Zone Mapper queries
│   │   ├── useBatteryState.ts    # Battery awareness
│   │   └── useOnboarding.ts      # Setup flow
│   ├── services/
│   │   ├── inference.ts          # CEBE-X bridge
│   │   ├── graph.ts              # Zone Mapper bridge
│   │   └── storage.ts            # Local data
│   ├── state/
│   │   └── traceStore.ts         # Zustand state
│   └── types/
│       └── domain.ts             # Type definitions
│
├── trace-cebe-x-engine/   # CEBE-X: ranking engine (Rust)
├── trace-sensing-engine/  # IMU: motion detector (Rust)
├── trace-zone-mapper/     # Zone Mapper: spatial index (Rust)
│
├── package.json
├── app.json
├── eas.json              # EAS build config
└── BUILD_PLAN.md         # Deployment guide
```

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g eas-cli expo-cli`
- Rust (if building engines): `rustup`

### Install

```bash
npm install
npx expo start
```

### Run

**iOS Simulator:**
```bash
npx expo run:ios
```

**Android Emulator:**
```bash
npx expo run:android
```

### Test

```bash
npm test
```

## Building for Stores

See [BUILD_PLAN.md](BUILD_PLAN.md) for step-by-step instructions:
- Building Rust engines for production
- Signing apps for iOS App Store and Google Play Store
- Submission process for both platforms

## Design Philosophy

Trace follows strict design principles:

1. **Code exists to make intent obvious, not to be clever.** Judges predict the next line—that's the goal.

2. **Type-first thinking.** Every concept has a type. Never raw dicts across boundaries.

3. **State machines over if-else chains.** Explicit, boring, correct.

4. **Battery efficiency by default.** Events over streams. Summarize early. No continuous processing.

5. **No ML unless necessary.** CEBE-X uses math and logic, not neural networks, for scoring disruptions.

6. **Comments explain why, not what.** Code is obvious. Why it exists matters.

## Technical Details

- **Binary Format:** Efficient wire protocol between engines
- **ONNX Runtime:** ML inference on-device at <500ms
- **FFI Bindings:** TypeScript ↔ Rust via C ABI
- **SQLite:** Local persistence for zones and disruptions
- **Zustand:** Lightweight state management for React

## Microservices

**Trace Sensing Engine** ([trace-sensing-engine/](trace-sensing-engine/))
- Processes raw IMU data
- Detects disruptions in real-time
- Output: Binary wire format messages

**Zone Mapper** ([trace-zone-mapper/](trace-zone-mapper/))
- Maintains spatial graph
- Indexes zone transitions
- Provides feature vectors for ranking

**CEBE-X Engine** ([trace-cebe-x-engine/](trace-cebe-x-engine/))
- Ranks disruption events
- Scores by relevance (0-1 confidence)
- Returns top-K candidates

See individual READMEs for implementation details.

## Related Work

Trace's approach is informed by:
- Cognitive neuroscience: Context restoration reduces disorientation
- UX research: Multimodal cues (visual + spatial) aid recall
- Mobile systems: Offline-first architecture preserves privacy and performance

## Documentation

- [BUILD_PLAN.md](BUILD_PLAN.md) — Build and deployment
- [ARCHITECTURE.md](ARCHITECTURE.md) — Deep technical dive
- [trace-sensing-engine/README.md](trace-sensing-engine/README.md) — IMU processing
- [trace-zone-mapper/README.md](trace-zone-mapper/README.md) — Spatial indexing
- [trace-cebe-x-engine/README.md](trace-cebe-x-engine/README.md) — Ranking engine

## Privacy

Trace processes all data on-device. Nothing is transmitted except:
- Optional Azure OpenAI service (only if you enable it)
- Optional Azure Speech service (only if you enable it)

Both are opt-in. Core Trace functionality works completely offline.

## Support

For issues or questions, see individual engine documentation or open an issue.

Trace is built to help people regain independence when interruptions steal their focus.
