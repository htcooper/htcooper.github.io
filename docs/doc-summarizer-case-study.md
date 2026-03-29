---
layout: page
title: AI Document Summarizer

introduction: |

    Designing an AI feature from POC to production, with built-in quality measurement.

    ---
    **Status:** POC complete (working app; production roadmap designed)
    **Stack:** Next.js 14 · TypeScript · OpenAI GPT-4o-mini · shadcn/ui
    **Code:** [View GitHub](https://github.com/htcooper/doc-summarizer){:target="_blank"}

    ---
    ## The Problem

    Users of learning management systems and document platforms upload dozens of files (lecture notes, worksheets, reports, scanned pages) and the only way to understand what each file contains is to open it one by one. In edtech, an educator might have 30 attachments in a single course module with no way to scan their content at a glance.

    Alternatives like keyword extraction, tagging, or full-text search still require the user to interpret raw data. Summaries give an instant "should I care?" signal. They reduce cognitive load as well as improve findability.

    The strategy: a narrow wedge. Summaries are generated automatically right after upload and shown inline wherever files appear. Immediate value with minimal user behavior change.

    ---
    ## My Approach

    How I think about building AI features:

    **Start with the UX shape, not the model.** The POC proves the interaction pattern (upload, summary, feedback) before adding infrastructure complexity. If the UX pattern doesn't work, the infrastructure doesn't matter.

    **Evaluation is part of the product.** The feedback widget in the POC is the foundation of the quality measurement framework. Without it, there's no way to know if summaries are actually helping users.

    **Sequence around risk.** Make the async pipeline reliable first, then add auth and cost controls, then expand to more file types. Don't introduce OCR failure modes before you can debug basic pipeline failures.

    **Trust and control go hand-in-hand.** Regenerate and manual override exist because users need control over AI output, especially in domains where accuracy matters for compliance or regulatory reasons. The number of manual overrides also becomes a proxy metric for quality.

    **Single provider is an intentional bet.** MVP uses one LLM provider (OpenAI). The interface supports future routing, but the complexity tax isn't paid until there's a reason: cost pressure, reliability issues, or a capability gap.

    ---
    ## What I Built

    The POC is intentionally minimal. It validates the core UX pattern and prompt quality before adding infrastructure complexity.

    ![Summary view](/assets/images/doc-summarizer-screenshot.png)

    - **Upload:** drag-and-drop with client-side validation (PDF only, 50MB max). PDF-only because it's the most common attachment type; multi-format support is an MVP expansion.
    - **Text extraction:** pdf-parse extracts text with error discrimination. Corrupt files, password-protected PDFs, and image-only PDFs each return a distinct error message with a clear next step for the user. No technical jargon is exposed.
    - **Summarization:** two parallel OpenAI calls generate an 8-word headline and 3 bullet points simultaneously. The 8-word limit forces concise, scannable summaries that stay visually compact across different UI contexts. The 3-bullet expansion gives enough detail without overwhelming.
    - **Centralized prompts:** all AI behavior lives in a single file. Prompts are tunable without touching application code. Text is truncated at 15,000 characters as a pragmatic token budget control.
    - **Feedback collection:** thumbs up/down inline with an optional comment field on negative feedback. Starting the feedback flywheel early is critical for AI features; it's how you build the data to improve prompt quality over time.
    - **Error handling:** every error returns a human-readable message AND a suggested next step. Rate limits, timeouts, invalid API keys, and corrupt files each have tailored copy. Technical details are logged server-side, never shown to users.
    - **Cancellation:** users can cancel in-flight summarization. Better UX when the wrong file is uploaded, and it avoids unnecessary token spend.

    **POC data flow:**

    ```
    Upload (drag-and-drop)
      → /api/upload (pdf-parse extracts text)
        → /api/summarize (parallel OpenAI calls: headline + bullets)
          → Summary Card (display + feedback widget)
    ```

    ---
    ## How I Would Measure Success

    These are the success criteria and measurement framework I designed for this feature. The metrics are pre-launch targets; the framework is designed to validate or adjust them with real usage data.

    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Primary metric</span></summary>

    **>70% positive feedback** (thumbs up) on summaries that receive feedback.

    </details>

    ---
    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Engagement check (the metric about the metric)</span></summary>

    If fewer than 5% of users give any feedback, the primary metric isn't meaningful yet. Before trusting the quality signal, A/B test the feedback UX: inline prompts, timing, placement. This is also where proxy metrics become essential.

    </details>

    ---
    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Proxy metrics (no explicit feedback required)</span></summary>

    - **Manual summary replacement rate.** When users replace an AI summary with their own text, that's a direct quality signal. High replacement rates indicate the AI output isn't meeting user expectations.
    - **Session pattern analysis.** If a user opens an attached file and returns to the app within 10 seconds, the file likely wasn't relevant, which may indicate a misleading summary. If they stay away for 2+ minutes, they're probably reading it, meaning the summary led them to the right content.

    </details>

    ---
    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Quality management framework</span></summary>

    - **Regression set:** 20 representative documents (short, long, technical, non-technical) evaluated after each prompt change
    - **Human rubric:** scored 1-5 on four dimensions: correctness, coverage, specificity, tone
    - **Prompt versioning:** changes can be A/B tested behind feature flags and rolled back if quality drops

    </details>

    ---
    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Failure acceptance</span></summary>

    Not all failures are equal. A failed summarization that surfaces a clear error message and retry option is acceptable because the user knows what happened and what to do. A silently wrong summary is not acceptable because it erodes trust without the user knowing.

    </details>

    ---
    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Cost model</span></summary>

    Rough estimates (prices subject to change with provider pricing updates):

    - GPT-4o-mini input: ~$0.15 / 1M tokens
    - Avg tokens per summary pair: ~2,000
    - Cost per summary: ~$0.0003
    - 10K summaries / month: ~$3 / month

    OCR and multi-format parsing add cost. Cost-per-summary is tracked as a production metric alongside quality; the goal is to optimize without quality loss.

    </details>

    ---
    ## Production Roadmap

    The roadmap is sequenced around risk, not features. Each phase builds on the reliability and observability of the previous one.

    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Phase 1: Make the pipeline reliable</span></summary>

    The POC is synchronous: the user waits while the API processes. Production needs to handle timeouts, retries, and long documents gracefully.

    - **Async job queue:** Supabase (chosen for built-in RLS, auth, and Postgres, giving one service for persistence and access control) creates a job row on upload. An AWS Lambda worker (serverless, scales to zero when idle, no infra to manage) processes jobs and writes results back.
    - **Run telemetry from day 1:** every summarization run logs the model, token count, latency, and errors to Supabase. This is non-negotiable. Without it, quality and cost issues are invisible.
    - **Feature flags:** enable or disable summarization without breaking existing upload flows. This is both a launch mechanism and a rollback mechanism.

    </details>

    ---
    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Phase 2: Add trust and access control</span></summary>

    - **Supabase Auth + RLS (row-level security):** owner-only access by default. RLS is chosen over application-level permission checks because access control lives in the database layer, not scattered across API routes. A user cannot read another user's summaries, enforced at the query level.
    - **Status-driven UX:** the summary card reflects real job states (queued, processing, succeeded, failed) pulled from the database, not local ephemeral state.
    - **Integration and E2E tests** before expanding scope. The pipeline must be proven reliable before adding more complexity.

    </details>

    ---
    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Phase 3: Expand capabilities</span></summary>

    - **Multi-format support:** .txt, .md, .docx in addition to PDF.
    - **OCR for scanned PDFs:** this comes after monitoring exists because OCR adds both cost and new failure modes that need the observability from Phase 1.
    - **Custom summary replacement + regenerate:** users can write their own summary (replacing the AI version) or regenerate a new AI summary. Both are trust mechanisms that give users control. Replacement rate also feeds back into quality measurement.

    </details>

    ---
    <details markdown="1">
    <summary><span style="font-size: 1.35rem; font-weight: 700;">Phase 4: Production and observability</span></summary>

    - **Phased rollout via feature flags:** gradually release to increasing user segments based on stability metrics. Feature flags are used for launch and as the rollback mechanism.
    - **Vercel for hosting:** zero-config Next.js deployment with preview environments per PR.
    - **Dashboards:** per-step latency, cost (tokens), success rate, breakdown by file type and provider.
    - **Automated alerts:** spend spikes, error-rate thresholds, queue backlog, timeout surges, with runbooks for each scenario.
    - **Optimization based on production data:** tune chunking, prompts, and retry strategies using real telemetry. Reduce cost without quality loss.

    </details>

    ---
    ## Architecture

    ### POC (what exists today)

    ```
    File Browser UI
      → Next.js /api/upload (pdf-parse extracts text)
        → Next.js /api/summarize (OpenAI GPT-4o-mini)
          → Summary Card (display + feedback widget)

    Synchronous. In-memory. No persistence.
    ```

    ### Production (designed)

    ```
    File Browser UI
      → Next.js on Vercel (zero-config deploys, preview environments)
        → Supabase (Postgres + RLS + Auth: persistence, access control, job queue)
          → AWS Lambda (serverless async worker: extraction + summarization + retry)
            → Supabase (results + run telemetry)
              → Next.js (polling for status updates)
                → Summary Card (display + feedback widget)

    Feature flags. Run telemetry. Monitoring dashboards.
    ```

    The POC proves the UX pattern works. The production architecture makes it reliable, secure, and observable at scale.

    ---
    ## Key Technical Decisions

    **Centralized prompts.** All AI behavior lives in a single file (`prompts/summarize.ts`). Prompts are product decisions about tone, length, and specificity. Keeping them in one file makes them reviewable, versionable, and independently tunable without code changes.

    **Dual-call pattern.** Short summary and expanded bullets are generated by parallel, independent OpenAI calls via `Promise.all`. This enables independent prompt tuning for each output format. A single structured-output call would couple them.

    **Error discrimination.** The PDF parser inspects error messages to distinguish password-protected, corrupt, and image-only failures. Each returns a tailored user-facing message with a concrete next step. The user never sees a stack trace.

    **15,000 character truncation.** A pragmatic token budget control for the POC. Production would use smarter chunking strategies informed by run telemetry data (document length distribution, truncation frequency).

    ---
    ## What I Learned

    **The most consequential part of an AI feature is everything around the API call,** including error handling, retry logic, quality measurement, and user trust. In this POC, the OpenAI integration was straightforward, so I focused on what actually creates the greatest impact: making the feature feel reliable.

    **Prompt engineering is a product concern.** The prompts in this project are decisions about tone ("3rd person active voice"), length ("8 words or fewer"), and what to prioritize ("skip introductions, focus on substance"). These are product decisions, not engineering ones.

    **Defining success criteria before writing code changes what you build.** The feedback widget exists because the measurement framework required it. The manual override feature exists because replacement rate is a proxy metric. Starting with "how will we know this works?" shapes the feature itself.

    ---
    ## Resources
    - Code: [View GitHub](https://github.com/htcooper/doc-summarizer){:target="_blank"}


---
