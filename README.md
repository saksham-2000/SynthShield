# SynthShield: Guaranteed Synthetic Data

> Train your models. Protect your precious data.

<br>

SynthShield lets you upload a sensitive CSV, tune a privacy budget, and get back a synthetic dataset that your models can train on without you ever exposing a real record. Built on top of a T5-small seq2seq model with LoRA adapters, trained end-to-end through Opacus.

<br>

**Live demo:** https://synthshield-frontend-497796918458.us-central1.run.app
<br>
**GitHub:** https://github.com/saksham-2000/SynthShield

---

Built in 24 hours at **CheeseHacks 2026** (Feb 28 - Mar 1, 2026).

**Team: Cheddar++**

- [Saksham Garg](https://github.com/saksham-2000)
- [Rohan Gupta](https://github.com/rohankrgupta)
- [Jeevesh Mahajan](https://github.com/jeevesh28)
- [Keshav Handa](https://github.com/koder2223)

---

## The Problem

The datasets that would train the best models are exactly the ones you cannot freely share. Healthcare records, financial histories, user behavior logs: all locked behind HIPAA, GDPR, and SOC 2 compliance requirements that make exposing them, even internally, a genuine liability.


SynthShield generates synthetic records that are statistically equivalent to the originals at the population level, while providing a formal, mathematical guarantee that no individual row is recoverable.

---

## How It Works

### The core idea: tabular data as text

Rather than building a domain-specific tabular synthesizer from scratch, we treated each row as a structured sentence. A patient record that looks like this in CSV:

```
Name,Age,Medical Condition,Billing Amount
John Doe,42,Diabetes,14200.50
```

becomes this during training:

```
Name: John Doe | Age: 42 | Medical Condition: Diabetes | Billing Amount: 14200.50
```

We fine-tune T5-small to generate new rows in this format given the prompt `"Generate one realistic synthetic patient row:"`. The model learns the joint distribution of fields across the dataset. After training, sampling from it gives you statistically plausible rows that were never in the training data.

The trick that makes this actually private is Opacus.

### Differentially private fine-tuning

The fine-tuning loop runs through Opacus's `PrivacyEngine` with the following setup:

- **LoRA adapters** on the query and value attention matrices of T5-small (r=8, alpha=16, dropout=0.05). We only fine-tune a small fraction of the model's parameters, which reduces the sensitivity of gradients and plays nicely with DP noise.
- **Poisson sampling** for batches, which is required for the formal privacy accounting to hold.
- **Per-sample gradient clipping** at max norm 1.0. Opacus handles this automatically via `BatchMemoryManager`, which splits logical batches (size 64) into physical microbatches (size 16) to keep memory manageable.
- **RDP accountant** to track the cumulative privacy cost across epochs. After 5 epochs the total epsilon lands at approximately 4.0, with delta=1e-5.

The noise multiplier is computed before training via `get_noise_multiplier` and stays fixed throughout, so the (epsilon, delta) guarantee is exact, not estimated after the fact.

### Two-phase architecture

Training is expensive. Serving should be fast. The backend separates these concerns:

**Offline (done before deployment):**
1. Fine-tune T5-small with LoRA + Opacus on the target dataset
2. Generate the synthetic CSV from the trained adapter
3. Drop both the adapter weights and the generated CSV into `assets/artifacts/`
4. Write a `.model_ready.marker` file so the server knows artifacts exist

**Online (the API endpoint):**
1. Receive the uploaded CSV (the filename maps to an artifact)
2. Check if a pre-generated CSV artifact exists for that dataset
3. If yes, return it immediately as `text/csv`
4. If no artifact exists but model weights do, run inference on the fly
5. If neither exists, trigger fine-tuning, then generate

In practice for the demo, artifacts are pre-baked. The `/process` endpoint is effectively sub-100ms.

### Privacy Lookup

After synthesis, you can type any name or value from the original dataset into the search panel. SynthShield searches both CSVs side by side. The moment a record appears in the original but not the synthetic output, you get:

```
Search: "John Doe"

Original CSV    ->  1 match  (John Doe, Age 42, Diabetes, $14,200)
Synthetic CSV   ->  Not found. Privacy preserved.
```

That is the gut-check. If the model actually learned a distribution rather than memorizing rows, individual records should not show up.

### Quantifying fidelity: KL divergence

We compute KL divergence per column between the original and synthetic distributions (binned for numerical, frequency-counted for categorical), with epsilon smoothing at 1e-10 to handle zero bins. The mean across all columns becomes the summary score shown on the results page.

Example output on a healthcare dataset (epsilon=20):

| Column | KL Divergence |
|--------|--------------|
| Name | 0.008 |
| Doctor | 0.011 |
| Medical Condition | 0.019 |
| Age | 0.14 |
| Billing Amount | 0.21 |

Categorical columns like Name score near-zero because both original and synthetic distributions are approximately uniform across high-cardinality values. Numerical columns like Age drift more because Laplace noise shifts the mean, which displaces the binned histogram. Both are expected and acceptable.

---

## Tech Stack

**Backend**

| Component | Technology |
|-----------|-----------|
| API server | FastAPI + uvicorn |
| Model | T5-small (Hugging Face transformers) |
| LoRA adapters | PEFT (r=8, alpha=16, target: q + v) |
| DP training | Opacus (RDP accountant, Poisson sampling) |
| Data handling | pandas |
| Containerization | Docker (python:3.11-slim) |
| Deployment | Google Cloud Run |

**Frontend**

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| CSV parsing | PapaParse |
| State | Zustand |
| Deployment | Google Cloud Run |

---

## Running Locally

### Prerequisites

- Node.js 18+
- Python 3.11+
- npm

### Frontend

```bash
git clone https://github.com/saksham-2000/SynthShield.git
cd SynthShield/frontend
npm install
npm run dev
```

Open http://localhost:3000. The frontend points to the live Cloud Run backend by default, so you do not need to run the backend locally to try the UI.

### Backend

```bash
cd SynthShield/backend
pip install fastapi uvicorn pandas python-multipart

# For local inference / fine-tuning (heavy dependencies, optional):
pip install torch transformers peft opacus numpy tqdm

uvicorn src.main:app --reload --host 0.0.0.0 --port 8080
```

If you want to run fine-tuning locally, place your training CSV at `backend/assets/training_data/healthcare_dataset.csv` and hit the `/process` endpoint. The server will fine-tune, generate artifacts, and serve them on subsequent requests.

To point the frontend at your local backend, update `BACKEND_URL` in `frontend/src/hooks/useSynthesize.ts`:

```typescript
const BACKEND_URL = 'http://localhost:8080/process'
```

---

## Project Structure

```
synth-shield/
  backend/
    src/
      main.py                  # FastAPI app, /process endpoint, artifact resolution logic
      finetune_module.py       # LoRA fine-tuning with Opacus DP training loop
      generate_csv_module.py   # T5 inference, pipe-delimited row parsing, CSV output
    assets/
      artifacts/
        model_weights/
          t5-small-lora/       # LoRA adapter weights (adapter_config.json, safetensors)
        generated_csv/         # Pre-generated synthetic CSVs (*_dp.csv)
      training_data/           # Original dataset CSVs (not committed)
    Dockerfile
  frontend/
    src/
      app/
        page.tsx               # Root: Navbar, Hero, Ticker, MainContent
        globals.css            # Keyframes: ticker scroll, rainbow-cycle, brownian drift
      components/
        Hero.tsx               # Gradient heading, animated subtitle
        Ticker.tsx             # Feature ticker with Brownian vertical drift
        Navbar.tsx             # GitHub link, CheeseHacks badge
        UploadConfig.tsx       # CSV drop zone, epsilon slider (1-100)
        GenerateProgress.tsx   # Terminal-style synthesis animation
        Results.tsx            # Column histograms, KL divergence panel, Privacy Lookup
        Download.tsx           # CSV and PDF export
        MainContent.tsx        # Phase controller (idle / generating / results)
      hooks/
        useSynthesize.ts       # API call, concurrent animation, header normalization
      store/
        appStore.ts            # Zustand: phase, dataset, syntheticRows, epsilon
    public/
      privacy-icon.svg
      cheesehacks-icon.png
    Dockerfile                 # 3-stage: deps / builder / runner (alpine, non-root)
  .github/
    workflows/
      deploy-frontend.yml      # CI/CD: build -> Artifact Registry -> Cloud Run
```

---

## Architecture Notes

### Why T5-small for tabular synthesis?

T5 is a seq2seq model trained on masked span reconstruction. It turns out this makes it a reasonable fit for learning row-level correlations in tabular data when you serialize rows as pipe-delimited text. The model sees thousands of examples of `field: value | field: value | ...` sequences during fine-tuning and learns which combinations of values co-occur realistically. At generation time, sampling with temperature=0.9 and top-p=0.95 produces diverse outputs that are not verbatim copies of training rows.

LoRA keeps the parameter count small (adapters add roughly 300K trainable parameters on top of 60M frozen T5-small weights), which is what makes DP training feasible without a GPU cluster.

### Concurrent animation and API call

Rather than running the animation and the API call sequentially, we use `Promise.all`:

```typescript
const [syntheticRows] = await Promise.all([
  fetchSynthetic(dataset, epsilon),  // actual API call
  runAnimation(),                    // 6-7 second terminal effect
])
```

Both kick off at the same time. Results appear when both finish. The animation never adds dead time on top of a slow model response, and a fast cache hit never skips the synthesis animation. It is a small thing, but it matters for how the product feels.

### Header normalization

Backends are not always well-behaved about returning column names in exactly the format they received them. The `normaliseToOriginalHeaders()` function does a case-insensitive, trim-aware remap of backend column names back to the original dataset headers, strips BOM characters, and fills any missing columns with empty strings. This runs on every response so histograms, KL divergence, and Privacy Lookup all index into the same header namespace.

---

## Privacy Guarantee

If you run the fine-tuning pipeline on a dataset of N individuals, and then run it again with one individual removed, the two resulting model distributions are bounded in how different they can be. The bound is controlled by epsilon (we target epsilon=4, delta=1e-5 during training). No single person's data shifts the output in a statistically detectable way. That is the Opacus guarantee, implemented via the RDP accountant and per-sample gradient clipping.

The KL divergence scores on the results page give you empirical confirmation at inference time. They measure how closely the synthetic distribution matches the original, not whether any individual is recoverable. You want high fidelity (low KL) and strong privacy (low epsilon). SynthShield gives you both: pre-trained adapters at epsilon=4 with KL scores under 0.1 on the healthcare dataset.

---

## Deployment

Both services are deployed on Google Cloud Run and scale to zero when idle.

**Frontend** deploys automatically via GitHub Actions on any push to `main` that touches `frontend/`:

```
Cloud Run (frontend)
  image:         us-central1-docker.pkg.dev/synthshield-fe/synthshield/frontend
  port:          3000
  min-instances: 0
  max-instances: 3
  memory:        512Mi
```

**Backend** is deployed separately with the pre-generated artifact CSVs and LoRA weights baked into the Docker image at build time:

```
Cloud Run (backend)
  port:          8080
  min-instances: 0
```

---

## Built at CheeseHacks 2026

Everything in this repo was written between February 28 and March 1, 2026.

**Hackathon:** CheeseHacks 2026
**Event:** https://cheesehacks.dev/

---

## License

MIT
