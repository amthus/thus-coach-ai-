# Stride_AI: System Architecture for Adaptive Running Progression

Stride_AI is an enterprise-grade full-stack artificial intelligence application designed to assist running athletes in achieving structured, physiological cardiorespiratory optimization without the risk of physical injury. Engineered with a robust Express server-side security layer and a highly responsive React client interface, Stride_AI delivers customized four-week athletic training blueprints with real-time feedback mechanisms, metabolic calculations, and dynamic training plan recalibration.

## Project Relevance and Key Features

Stride_AI integrates modern advances in sports science, web security, and server-side generative artificial intelligence.

1. **Calculated Cardio Zones**: Integration of a physiological calculator based on the Karvonen formula. Rather than utilizing basic age-based maximum heart rate approximations, Stride_AI integrates heart rate reserve to define exact cardiovascular zones.
2. **Post-Run Load Calibration**: Athletes can log subjective physical fatigue on a scale of 1 to 10 after completed workouts. This trigger triggers real-time load calibration advise through server-side intelligence.
3. **Multi-Coach Scientific Persona Selection**: System interface allows users to alternate between specific coach profiles. Each persona delivers customized tactical feedback tailored to different physical training philosophies.
4. **Secure Hybrid Architecture**: All integration hooks with LLM APIs are kept inside isolated node processes on the server. No security tokens or proprietary prompt sequences are exposed to the client side browser.

---

## 1. The Global Problem Statement

According to clinical studies in sports medicine, over seventy percent of all amateur running athletes experience a training-related injury within their first twelve months of activity. The direct cause is two-fold:

* **Cardiovascular Mismanagement**: Amateur runners frequently conduct simple footings at excess heart rates, running in high-intensity anaerobic clusters when they should be developing their aerobic base in low-intensity zones (60 to 70 percent of heart rate reserve). This causes cumulative chronic fatigue and metabolic stalling.
* **Lack of Dynamic Volume Progression**: Static training sheets fail when real-world interruptions occur. If an athlete experiences localized muscle pain, shin splints, or systemic fatigue, a static schedule forces them to proceed linearly, triggering mechanical failures like patellofemoral pain syndrome or Achilles tendinitis.
* **Access Disparity**: Professional physical coaching, sports physiology exams, and precise metabolic thresholds remain financially out of reach for a major portion of the running community.

---

## 2. The Stride_AI Solution

Stride_AI addresses these core friction points by acting as a real-time, personalized virtual exercise physiologist:

* **Subjective Fatigue Feedback Loops**: By monitoring the physical fatigue experienced during sessions, the system suggests immediate changes in upcoming running volumes to maximize muscle tissue recovery and prevent joint injury.
* **Karvonen Zone Synchronization**: By collecting age and resting heart rate metrics, the application establishes the reserve heart rate range, guiding the user to structure intervals exactly at specified paces.
* **Context-Aware Safety Rails**: If an athlete records specific physical symptoms or injury histories (such as ankle or knee instabilities), the app's prompt architecture guides the system to inject non-impact instructions into the workout calendar.

---

## 3. Server-Side Artificial Intelligence Engineering

To secure high-performing and deterministic results, the application runs a multi-provider backend setup using primary and secondary models.

### Google Gemini 3.5 Flash Integration
The main server processes generate custom plans using the new @google/genai SDK, leveraging Gemini 3.5 Flash. Generative tasks use strict JSON schema constraints. This guarantees that fields such as `weeks`, `sessions`, `intensityPercent`, and physical parameters conform exactly to the model definitions needed by the frontend interfaces, eliminating syntax parse errors.

### IBM Watsonx Granite Redundancy
A secondary translation middleware is built to support IBM Watsonx Granite models (using `ibm/granite-13b-instruct-v2`). In cases of API rate limit breaches or regional latency spikes, the application's runtime automatically proxies requests through Watsonx endpoints, ensuring high-availability during competition showcases.

### Isolation of Secret Variables
API credentials, backend port bindings, and Watsonx project parameters are declared within isolated environmental parameters. This keeps the application isolated from client-side reverse-engineering attempts.

---

## 4. Technical Architecture and Stack

The system is constructed with a fast, modern, and type-safe stack:

* **Frontend Engine**: Single Page Application built on React 19, powered by Vite for fast bundle delivery and hot compilation. Styled using custom Tailwind CSS utility systems for performance.
* **Backend Server**: Node.js core utilizing Express for low-latency REST endpoint routing. Integrates standard JSON body interpreters and manual request validations.
* **Component Framework**: Lucide vector assets for high-resolution rendering, and customized chart logic tracking long-term weekly stress scores.
* **Global Port Alignment**: Dev and production containers run on port 3000 behind high-performance ingress proxies to map global domain paths.

---

## 5. Security and Compliance Controls

Stride_AI prioritizes data minimization and identity security.

* **Local Storage Sandbox**: Personal health metrics, training history, and dynamic configuration states are persisted in the sandboxed browser environment of the user. Because this data is not compiled on unauthorized public SQL databases, athlete health privacy is fully preserved.
* **No Client Keys Leak**: No calls to third-party endpoints are executed directly inside the user's browser. Safe proxy routes on the backend enforce the principle of least privilege, blocking data sniffing via browser inspection tools.

---

## 6. Local Setup and Deployment Guide

### Configuration Parameters
Create a .env file based on the provided template in the application root directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key
IBM_WATSONX_API_KEY=your_ibm_watsonx_api_key
IBM_WATSONX_PROJECT_ID=your_ibm_watsonx_project_id
```

### Script Execution Commands

To execute the project locally inside a development container, run the following commands:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Launch Express Dev Server**:
   ```bash
   npm run dev
   ```
   This boots the backend engine on port 3000. Under development mode, the server mounts Vite as a runtime middleware, serving hot typescript assets safely on the same address.

3. **Production Compilation**:
   ```bash
   npm run build
   ```
   This commands bundles the React assets under a static directory and transpiles the backend server into a single optimized file.

4. **Production Start**:
   ```bash
   npm run start
   ```
   Executes the optimized build on your container deployment.

---

Stride_AI represents a serious, scientific, and enterprise-grade approach to democratizing sports health, combining secure hybrid architectures with deterministic AI response schemas.
