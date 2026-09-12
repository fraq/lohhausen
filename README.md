# Lohhausen

> **An interactive web simulation of complex municipal governance based on Dietrich Dörner's seminal work *The Logic of Failure* (Die Logik des Mißlingens).**

As the newly elected mayor of Lohhausen, you oversee the city's complex interconnected systems across 120 simulated months. Decisions regarding the municipal watch factory, public finances, housing, social infrastructure, and tourism interact dynamically with time delays, feedback loops, and non-linear side effects.

This project is an educational reconstruction of the systemic principles explored in Dietrich Dörner's psychological research. The original mathematical equations of the 1970s experiment remain unpublished; this simulator uses a validated system dynamics engine with explicit, observable coefficients. It serves as an educational learning environment rather than a psychological assessment.

[Русская версия документации](README.ru.md)

---

## Quick Start

Requires **Node.js 22** or higher. Zero external dependencies.

```sh
npm start
```

Then navigate to: **http://127.0.0.1:4173**

To run on an alternate port:
```sh
PORT=4174 npm start
```

The embedded zero-dependency HTTP server serves only application assets locally. Source literature, research materials, and development logs are strictly isolated from HTTP serving. No external fonts, analytics, telemetry, or remote CDNs are utilized.

---

## Key Features

### 1. Mayoral Cockpit & Advisors
- **5 Municipal Departments:** Factory, Municipal Finances, Housing, Social & Education, Tourism.
- **Personal Department Advisors:** Authentic German advisory council (Krause, Weber, Bauer, Frank, Lindemann) offering situational briefings and risk assessments.
- **What-If Policy Preview:** Real-time feedback displaying direct effects, second-order side effects, and systemic risks for every policy slider before committing turns.
- **Causal Turn Digest:** Month-by-month chronicle decomposing state transitions into causal drivers.
- **Causal Loops Explorer (CLD):** Interactive SVG maps illustrating Dörner's 5 core feedback loops (tax traps, wear cascades, capacity delays, and quality degradation).
- **Systemic Health Radar:** 5-axis radar chart with a critical 40% danger ring and historical baseline comparisons.

### 2. Historical Educational Scenarios
Structured scenarios designed to test systemic thinking under distinct stress conditions:
- **Free Play** (*Freies Spiel*, 120 months) — Full open-ended governance sandbox.
- **Watch Factory in Distress** (*Die Uhrenfabrik in Not*, 36 months) — Industrial crisis with 76% equipment wear requiring recapitalization without debt trap.
- **Tourism Dilemma** (*Die Tourismus-Falle*, 48 months) — Balancing marketing-driven visitor demand against housing bottlenecks and local resentment.
- **Dörner Stress-Test** (*Das Dörner-Dilemma*, 60 months) — Severe multi-domain systemic instability demanding holistic stabilization.

### 3. Cognitive Debriefing Engine
- **Behavioral Archetypes:** Benchmarking player decisions against historical patterns from Dörner's experiments (*Conrad* the systemic strategist vs. *Marcus* the reactive repairman).
- **Decision Journal & Hypothesis Verification:** Tracks whether player predictions matched subsequent realities across delayed project completions.
- **Heuristic Cognitive Trap Detection:** Identifies thematic bouncing, delayed feedback ignorance, repair-service mentality, and unmonitored project investments.
- **AI-Powered Debrief Export:**
  - One-click **Copy AI Prompt** formatted for Claude, Gemini, ChatGPT, and Codex with complete session telemetry, counterfactual analysis, and reflection prompts.
  - **LMN v1.2 (Lohhausen Match Notation):** Structured JSON chess-like game record with algorithmic turn evaluations (`!!`, `!`, `—`, `?!`, `?`, `??`).

### 4. Multilingual & Client-Side Architecture
- **Full 4-Language Support:** English, German (Deutsch), French (Français), and Russian (Русский). Language selection updates dynamically via URL (`?lang=en`, `?lang=de`, `?lang=fr`, `?lang=ru`).
- **Zero Framework Footprint:** Pure vanilla ES modules, modern standard Web APIs, and CSS Grid/Flexbox.
- **Browser-Local Storage:** Game state is persisted client-side in `localStorage`.

---

## Verification & Architecture

The system is developed using strict Test-Driven Development (TDD) and mathematical state verification:

```sh
# Run all unit and regression tests (124+ tests)
npm test

# Verify syntax across core modules
npm run check

# Run 720-month continuous multi-scenario verification
node scripts/verify-scenarios.mjs

# Verify HTTP routing and asset isolation (with server running)
node scripts/verify-http.mjs
```

### Core Modules

- `src/model.js` — System dynamics simulation core, state snapshots, and serialization.
- `src/causal.js` — Causal loop analysis, advisor heuristics, and What-If previews.
- `src/counterfactual.js` — Counterfactual branching engine (*"What if this project hadn't been built?"*).
- `src/scenarios.js` — Scenario catalog, objectives, and benchmark comparisons.
- `src/debrief.js` — Cognitive debriefing analyzer, LMN notation, and AI prompt synthesis.
- `src/visuals.js` — Dynamic SVG visualizations (radar chart, CLD loops, trajectory charts).
- `src/app.js` — Mayoral cockpit UI, client routing, and state orchestration.
- `src/locales/` — Multilingual dictionary catalogs for all interface elements.

---

## License & Attribution

- Inspired by the research and literature of **Prof. Dr. Dietrich Dörner** (*Die Logik des Mißlingens: Strategisches Denken in komplexen Situationen*).
- Educational software project.
