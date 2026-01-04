# Trace App — Build & Deployment Plan (Azure-Centric)

This document defines how Trace is built, integrated, and deployed **as an Azure-first cognitive accessibility system**.

**Core Philosophy:**
- **Edge (Rust):** Immediate sensing, privacy buffering, and zero-latency actuations.
- **Cloud (Azure):** Higher-order reasoning, context synthesis, and adaptive guidance.

This plan is written to be restartable and defensible.

---

## Phase 0: Preconditions & Framing Lock

**Non-Negotiable Truths:**
- Trace **requires Azure AI** for context reasoning.
- Local engines execute sensing, **not intelligence**.
- If Azure is unavailable, Trace enters **"Resilient Mode"** (buffering data), avoiding silent failure.

---

## Phase 1: Azure Foundation (The Brain)

### 1.1 Azure Services Provisioning

| Service | Purpose | Required |
|------|-------|---------|
| **Azure OpenAI (GPT-4o)** | Core interruption reasoning | ✅ |
| **Azure AI Foundry** | Model training & synthetic data | ✅ |
| **Azure App Service** | Secure Inference Gateway (API Proxy) | ✅ |

### 1.2 Azure API Layer (Security)
Trace does NOT call OpenAI directly.
- **Role:** Validate payloads, mask PII, enforce rate limits.
- **Output:** Returns structured guidance JSON to the app.

---

## Phase 2: Rust Engine Compilation (The Body)

**CRITICAL:** We must build for both **Physical Devices** (Release) and **Simulators** (Development).

### 2.1 Install Build Tools
```bash
# Rust targets for iOS (Device + Simulator)
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

# Rust targets for Android (Device + Emulator)
rustup target add aarch64-linux-android x86_64-linux-android

# Header Generation Tool
cargo install cbindgen
```

### 2.2 Compilation & Linking (The "Glue")
For each engine (IMU, CEBE-X, ZoneMapper), run:

**iOS Build:**
```bash
# 1. Generate C-Headers (Required for React Native to see Rust)
cbindgen --config cbindgen.toml --crate trace-sensing-engine --output ios/include/trace_sensing.h

# 2. Build for Device
cargo build --release --target aarch64-apple-ios

# 3. Build for Simulator (M1/Intel)
cargo build --release --target aarch64-apple-ios-sim
cargo build --release --target x86_64-apple-ios

# 4. Create Universal Library (Lipo) - This prevents "Architecture Missing" errors
lipo -create -output ios/libs/libtrace_sensing.a \
    target/aarch64-apple-ios/release/libtrace_sensing.a \
    target/aarch64-apple-ios-sim/release/libtrace_sensing.a \
    target/x86_64-apple-ios/release/libtrace_sensing.a
```

**Android Build:**
```bash
# Build .so files for ARM64 and x86_64 (Emulator)
cargo build --release --target aarch64-linux-android
cargo build --release --target x86_64-linux-android
```

---

## Phase 3: Azure–CEBE-X Integration

**Data Flow:**
Sensors → IMU Engine (Rust) → Zone Mapper (Rust)
        → **Azure API Gateway** (Security)
        → **GPT-4o** (Reasoning)
        → Physical Guidance UI

**The Azure Contract:**
The app sends a *behavioral summary* (e.g., "High entropy motion, duration 40s").
Azure returns *guidance strategy* (e.g., "Anchor: Kitchen, Confidence: High").

---

## Phase 4: App Configuration (Visible Intelligence)

### 4.1 UI States
The UI must visualize the "Handshake" between Edge and Cloud.

| State | Visual Indicator |
|-------|------------------|
| **Sensing** | Subtle waveform (Rust Engine active) |
| **Reasoning** | Pulsing upward stream (Sending to Azure) |
| **Guidance** | Haptic Compass (Received from Azure) |
| **Offline** | "Buffering Context... Waiting for Sync" (Resilient Mode) |

**Important:** Never show a blank screen. If Azure is thinking, show it.

---

## Phase 5: Testing Strategy

### 5.1 The "Basement" Test (Offline Handling)
- **Scenario:** User loses WiFi.
- **Behavior:** App switches to **Resilient Mode**.
    - Stores sensor data locally.
    - UI: "Connection weak. Buffering context."
    - **Does NOT** attempt to guess guidance (safety first).
    - Upon reconnection: "Context synced. Ready to guide."

---

## Phase 6: Store Submission

**App Store Description:**
"Trace is a cloud-connected cognitive accessibility system. It uses on-device sensors to detect interruptions and **Azure Artificial Intelligence** to reason about context recovery. Requires internet connection for reasoning services."

---

## Status
- **Architecture:** Hybrid (Edge-Sensing / Cloud-Reasoning).
- **Build Pipeline:** Multi-target (Device + Simulator).
- **Safety:** Fail-safe (No offline guessing).

**Ready to Compile.**
