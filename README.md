# SynthShield: Guaranteed Synthetic Data

> **Train your models. Protect your precious data.**

SynthShield transforms sensitive CSV datasets into statistically equivalent synthetic copies — using differential privacy to give you a mathematical guarantee that no real individual is recoverable from the output. Upload a file, tune your privacy budget, and walk away with synthetic data your models can actually train on.

Built in 24 hours at **CheeseHacks 2026** (Feb 28 – Mar 1, 2026).

**Live demo:** [https://synthshield-frontend-497796918458.us-central1.run.app ](https://synthshield-frontend-497796918458.us-central1.run.app/)
<br>
**GitHub:** https://github.com/saksham-2000/SynthShield

---

**Team: Cheddar++**
- [Saksham Garg](https://github.com/saksham-2000)
- [Rohan Gupta](https://github.com/rohankrgupta)
- [Jeevesh Mahajan](https://github.com/jeevesh28)
- [Keshav Handa](https://github.com/koder2223)


---

## The Problem

The datasets that would train the most impactful models are precisely the ones you cannot freely share. Healthcare records, financial histories, user behavior logs — all of them sit behind legal walls (HIPAA, GDPR, SOC 2) that make sharing or exposing them, even internally, a real liability.

The usual workarounds are painful. Anonymization is brittle and famously reversible. Manually scrubbing PII is slow and error-prone. Full data vaults require infrastructure most teams do not have.

SynthShield breaks that deadlock with one upload and one click.

---

## How It Works

SynthShield uses the **Laplace noise mechanism** from differential privacy to synthesize new records that match the statistical fingerprint of your original dataset without containing any of the original individuals.

### Step by Step

**1. Upload your CSV**

Drag in any CSV up to 50,000 rows. SynthShield parses column headers automatically and infers types (numeric vs categorical) on the client side.

**2. Set your privacy budget (epsilon)**

The epsilon slider runs from 1 to 100:

| Range | Privacy Level | When to Use |
|-------|--------------|-------------|
| 1 to 20 | Strong | Medical, financial, legal data |
| 21 to 50 | Moderate | Internal analytics, behavioral data |
| 51 to 100 | Lower | Non-sensitive structured data where fidelity matters most |

The lower the epsilon, the more Laplace noise is injected and the stronger the privacy guarantee. At epsilon = 1, recovering any individual from the synthetic output is mathematically infeasible.

**3. Synthesize**

Your CSV is reconstructed client-side, sent to the FastAPI backend on Google Cloud Run, and processed through a LoRA-powered synthesis model with calibrated Laplace noise per column. The synthesis animation takes at least 6 seconds — not because we need it to, but because instant output does not inspire confidence.

**4. Verify with KL Divergence**

Every column gets a KL divergence score comparing its distribution in the original versus synthetic data. Lower is better.

Example output for a medical dataset:

| Column | KL Divergence | Rating |
|--------|--------------|--------|
| Name | 0.008 | Strong |
| Doctor | 0.011 | Strong |
| Medical Condition | 0.019 | Strong |
| Age | 0.14 | Moderate |
| Billing Amount | 0.21 | Moderate |

Categorical columns like Name and Medical Condition score near-zero because both original and synthetic distributions are approximately uniform across categories. Numerical columns like Age score slightly higher because Laplace noise shifts the mean, which moves the binned histogram.

**5. Privacy Lookup**

Type any name or value from the original dataset. SynthShield searches both CSVs side by side with keyword highlighting.

Example:

```
Search: "John Doe"

Original CSV       ->  1 match found  (John Doe, Age 42, Diabetes)
Synthetic CSV      ->  Not found. Privacy preserved.  [shield icon]
```

This is the gut-check moment. If John Doe cannot be found in the synthetic output, the guarantee is working.

**6. Download**

Export the synthetic CSV or an audit-ready PDF certificate summarizing the privacy parameters and KL divergence scores.

---

## Features

- Differential privacy via the Laplace noise mechanism, epsilon range 1 to 100
- LoRA-powered synthesis model served on Google Cloud Run
- Per-column KL divergence analysis with color-coded thresholds
- Privacy Lookup tool with side-by-side search and keyword highlighting
- Concurrent animation and API call (results appear when both are ready, minimum 6 seconds)
- Column header normalization handles casing, whitespace, and BOM characters from any CSV source
- Audit-ready PDF certificate generation
- Supports datasets up to 50,000 rows
- Fully responsive, dark-mode-native UI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| CSV parsing | PapaParse |
| State management | Zustand |
| Backend | FastAPI, Python |
| Synthesis model | LoRA fine-tuned model with Laplace noise |
| Deployment | Google Cloud Run |
| CI/CD | GitHub Actions |

---

## Running Locally

### Prerequisites

- Node.js 18 or higher
- npm
- Python 3.9+ (for the backend)

### Frontend

```bash
git clone https://github.com/saksham-2000/SynthShield.git
cd SynthShield/frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

The frontend will call the live backend on Cloud Run by default. No local backend setup required for basic use.

### Backend (optional, for local development)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

Then update `BACKEND_URL` in `frontend/src/hooks/useSynthesize.ts` from the Cloud Run URL to `http://localhost:8080/process`.

---

## Architecture

```
Browser (Next.js 14)
  |
  |-- PapaParse: CSV parsing, header normalization, BOM stripping
  |-- Zustand: global phase state  (idle | generating | results)
  |-- useSynthesize hook
  |     |-- Promise.all([runAnimation(), fetchSynthetic()])
  |     |-- Papa.unparse: reconstructs CSV from parsed rows for upload
  |     `-- normaliseToOriginalHeaders(): case-insensitive column remapping
  |
  `-- Results UI
        |-- Recharts BarChart: per-column histograms (original vs synthetic)
        |-- KL divergence: smoothed with epsilon=1e-10 to handle zero bins
        `-- Privacy Lookup: real-time search with inline keyword highlights

FastAPI Backend (Google Cloud Run, min-instances: 0)
  `-- POST /process  (multipart/form-data, file=CSV)
        |-- LoRA synthesis model
        `-- Laplace noise per column, calibrated to epsilon parameter
```

### Key Design Decision: Concurrent Animation and Fetch

Rather than running the synthesis animation and API call sequentially, SynthShield runs them with `Promise.all`. Both start at the same time. Results appear when both are done. This means the 6-7 second animation never adds extra delay on top of a slow model call, and the model call never skips the animation if it returns fast.

```typescript
const [syntheticRows] = await Promise.all([
  fetchSynthetic(dataset, epsilon),  // real API call
  runAnimation(),                     // minimum 6-7 second terminal effect
])
```

---

## Privacy Guarantee

Here is the plain-English version of what differential privacy actually gives you.

If you run SynthShield on a dataset of 10,000 patients, and then run it again with one patient removed, the two output distributions are mathematically bounded in how different they can be. The bound is controlled by epsilon. No single individual's presence or absence meaningfully changes the synthetic output in a detectable way. That is the Laplace mechanism guarantee.

KL divergence scores give you an empirical confirmation of this after the fact. A score below 0.05 means the synthetic distribution is nearly identical to the original at the column level. You get the utility of real data distribution. You lose the liability of real data exposure.

---

## Project Structure

```
synth-shield/
  frontend/
    src/
      app/
        page.tsx              # Root layout: Navbar, Hero, Ticker, MainContent
        globals.css           # Animations: ticker scroll, rainbow-cycle, brownian drift
      components/
        Hero.tsx              # Landing section with icon, heading, animated subtitle
        Ticker.tsx            # Auto-scrolling feature ticker with Brownian motion
        Navbar.tsx            # Fixed nav: GitHub link, CheeseHacks badge, auth buttons
        UploadConfig.tsx      # CSV drag-drop + epsilon slider
        GenerateProgress.tsx  # Terminal-style synthesis animation
        Results.tsx           # Histograms, KL divergence table, Privacy Lookup
        Download.tsx          # CSV and PDF export
        MainContent.tsx       # Phase-driven AnimatePresence controller
      hooks/
        useSynthesize.ts      # Core synthesis logic, API call, header normalization
      store/
        appStore.ts           # Zustand store: phase, dataset, synthetic rows, epsilon
    public/
      privacy-icon.svg        # Shield icon (inverted for dark theme)
      cheesehacks-icon.png    # Hackathon badge
    Dockerfile                # 3-stage build: deps, builder, runner (alpine, non-root)
  .github/
    workflows/
      deploy-frontend.yml     # Push to main -> build -> push to Artifact Registry -> deploy Cloud Run
```

---

## Deployment

The frontend is containerized with Docker (3-stage build, non-root Alpine runner) and deployed to Google Cloud Run via GitHub Actions on every push to `main` that touches `frontend/`.

```
Cloud Run settings:
  min-instances: 0   (scales to zero when idle, cost-efficient)
  max-instances: 3
  memory: 512Mi
  port: 3000
```

The backend runs as a separate Cloud Run service, also scales to zero.

---

## Built at CheeseHacks 2026

This project was built from scratch during the CheeseHacks 2026 hackathon, February 28 to March 1, 2026.


**Hackathon:** CheeseHacks 2026
**Event site:** https://cheesehacks.dev/

---

## License

MIT
