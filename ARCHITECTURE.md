# Trace App — Technical Architecture

System Design Document v1.0 (Azure-Centric)

This document defines the Azure-first architecture of Trace.

Trace is a cognitive accessibility system where Azure AI performs all reasoning
and decision-making, while the device performs sensing, summarization,
and physical execution.

Local components do not decide what matters.
They only observe, compress, and execute decisions made by Azure.

--------------------------------------------------------------------

1. Architectural Truths (Non-Negotiable)

These statements must remain true across documentation, demos, and judging.

- Azure is the Brain  
  All interruption validation, confidence scoring, and guidance decisions are
  executed by Azure OpenAI (GPT-4o).

- Edge is the Nervous System  
  Rust engines sense motion and build summaries. They do not reason.

- No Silent Intelligence  
  If Azure is unavailable, Trace disables guidance and informs the user.

- Assistive, Not Deterministic  
  Outputs are probabilistic guidance, not instructions or diagnoses.

If Azure is removed, Trace loses its core value.

--------------------------------------------------------------------

2. System Architecture Overview

High-level component flow:

User Interface (React Native)
        |
        v
Guidance State Machine
        |
        v
CEBE-X Runtime (Summarization)
        |
        v
Encrypted Local Event Buffer
        |
        v
Azure App Service (API Gateway)
        |
        v
Azure OpenAI GPT-4o
        |
        v
Guidance Strategy (returned to UI)

Parallel Edge Sensing Path:

IMU Engine (Rust) ---> Zone Mapper (Rust) ---> CEBE-X Runtime

--------------------------------------------------------------------

3. Layer Responsibilities

3.1 Presentation Layer (React Native)

Responsibilities:
- Display system state (Listening, Analyzing, Guiding, Unable to Guide)
- Render physical guidance (directional arrow + haptics)
- Never infer or guess without Azure confirmation

The UI never interprets sensor data directly.

--------------------------------------------------------------------

3.2 Guidance State Machine

Purpose:
- Prevent premature or unsafe guidance
- Enforce Azure dependency

States:
- Idle
- Monitoring
- AzureAnalyzing
- GuidanceActive
- AzureUnavailable

Only Azure can transition the system into GuidanceActive.

--------------------------------------------------------------------

3.3 Edge Layer (Rust)

Components:

IMU Engine
- Processes accelerometer, gyroscope, and magnetometer data
- Detects motion changes and interruption candidates

Zone Mapper
- Builds ephemeral relative zones without GPS
- Tracks transitions and dwell time

CEBE-X Runtime
- Extracts behavioral features
- Builds summarized context payloads
- Does NOT make decisions

--------------------------------------------------------------------

4. Cloud Intelligence Layer (Azure)

4.1 Azure App Service

- Authenticates requests
- Rate limits calls
- Acts as secure gateway to Azure OpenAI

4.2 Azure OpenAI (GPT-4o)

Primary responsibilities:
- Validate whether an interruption is meaningful
- Decide whether guidance should occur
- Select target context anchor
- Generate psychologically tuned guidance language

GPT-4o is not formatting strings.
It adapts guidance based on cognitive state.

--------------------------------------------------------------------

5. Data Flow

Edge Sensing Loop (Continuous):
- Frequency: ~50 Hz
- Location: On-device only
- Network: Never used

Steps:
1. Sensors emit motion vectors
2. IMU Engine detects changes
3. Zone Mapper assigns relative context
4. Events stored in encrypted local buffer

Azure Reasoning Loop (On-Demand):
- Triggered by user or sustained confusion
- Frequency: Low (rare, intentional)

Steps:
1. CEBE-X builds context summary
2. Summary sent to Azure App Service
3. GPT-4o reasons over context
4. Guidance strategy returned to device
5. UI renders physical guidance

--------------------------------------------------------------------

6. Security and Privacy Model

- Raw sensor data never leaves the device
- Only summarized behavioral vectors are sent to Azure
- No GPS coordinates, images, or PII transmitted
- Data encrypted at rest and in transit
- Azure processing is stateless and non-retentive

Trace is assistive software, not a medical diagnostic device.

--------------------------------------------------------------------

7. Failure Modes

Azure Unavailable:
- Guidance disabled
- User informed clearly
- No silent fallback logic

Low Confidence Result:
- Azure returns actionable = false
- UI displays "Unable to guide safely"

Sensor Failure:
- Edge engine restarts
- UI shows calibration state

--------------------------------------------------------------------

8. Summary

Trace is a real-time cognitive accessibility system that:

- Uses edge computing for sensing
- Uses Azure AI for reasoning
- Uses physical guidance to restore task continuity

Azure is not optional.
Azure is the intelligence anchor of the system.