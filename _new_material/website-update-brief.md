# Website update brief — verified facts to carry to the website repo

Prepared 17 September 2026 from the application workspace. Everything below is verified against the papers or the CV audit unless marked **[CONFIRM]**. Do not publish anything marked [CONFIRM] until Kevin supplies or checks it.

## Identity and bio facts

- Kevin (Jiankai) Pu, PhD candidate in Computer Science, University of Toronto, DGP Lab. Advisors: Tovi Grossman and Yan Chen.
- **Expected PhD completion: June 2027.** Employment availability and work authorization are **[CONFIRM]** — do not state a start date or visa status on the site.
- Email: jpu@dgp.toronto.edu. Site: kevinpjk.github.io. Google Scholar: user=TsENWEIAAAAJ.
- Visiting and industry: Visiting Scholar, UC Berkeley (Bjoern Hartmann); Student Researcher, Google DeepMind (PAIR); Research Scientist Intern, Meta Reality Labs; Research Intern, Allen Institute for AI (Semantic Scholar). Exact end date of the Google role is **[CONFIRM]**.

## Published work (verified titles, venues, DOIs)

| Year | Paper | Venue | DOI | Note |
|---|---|---|---|---|
| 2026 | Cocoa: Co-Planning and Co-Execution with AI Agents | CHI 2026 | 10.1145/3772318.3791673 | Best Paper Award (candidate-reported). Kevin is **second author**; the asterisk in the paper marks Ai2 internship work, not equal contribution. |
| 2025 | ProMemAssist: Exploring Timely Proactive Assistance Through Working Memory Modeling in Multi-Modal Wearable Devices | UIST 2025 | 10.1145/3746059.3747770 | First author |
| 2025 | StoryEnsemble: Enabling Dynamic Exploration & Iteration in the Design Process with AI and Forward-Backward Propagation | UIST 2025 | 10.1145/3746059.3747772 | Co-author |
| 2025 | IdeaSynth: Iterative Research Idea Development Through Evolving and Composing Idea Facets with Literature-Grounded Feedback | CHI 2025 | 10.1145/3706598.3714057 | First author |
| 2025 | Assistance or Disruption? Exploring and Evaluating the Design and Trade-offs of Proactive AI Programming Support (Codellaborator) | CHI 2025 | 10.1145/3706598.3713357 | First author |
| 2024 | VizGroup: An AI-Assisted Event-Driven System for Real-Time Collaborative Programming Learning Analytics | UIST 2024 | — | Co-author |
| 2024 | Behind the Pup-ularity Curtain: Understanding the Motivations, Challenges, and Work Performed in Creating and Managing Pet Influencer Accounts | CHI 2024 | — | Co-author |
| 2023 | DiLogics: Creating Web Automation Programs with Diverse Logics | UIST 2023 | 10.1145/3586183.3606822 | First author |
| 2022 | SemanticOn: Specifying Content-Based Semantic Conditions for Web Automation Programs | UIST 2022 | 10.1145/3526113.3545691 | First author, Best Paper Honorable Mention |

Workshop paper: LOOM: Personalized Learning Informed by Daily LLM Conversations Toward Long-Term Mastery via a Dynamic Learner Memory Graph. Justin Cui, Kevin Pu, Tovi Grossman. AAAI 2026 Workshop on Personalization in the Era of Large Foundation Models (PerFM).

Full author lists are in `latex/references.bib` in the application workspace. Copy that file rather than retyping names.

## Manuscripts under review (handle carefully)

All three are anonymized submissions. **Before any of these appear publicly, Kevin must confirm** (a) the exact author list and order, (b) that the venue's anonymity policy permits listing, and (c) employer or host approval — Google for Sidecar, Berkeley for Helm.

1. **Too Long to Watch, Too Short to Leave: Designing for Agent Micro-Waits** (Sidecar). First author. A parallel read-only side chat that reads a running agent's context and surfaces the decisions it made that you never specified. **Do not name internal or pre-release model and platform versions on the site.**
2. **Helm: Turning Situated Feedback into Reusable Guidance for Steering Multi-Agent Workflows.** First author. Turns situated corrections into scoped, reusable guidelines with provenance.
3. **Who Shapes What Persists? Negotiating Personal Context Across LLM Conversations** (WeaveChat). Second author, supervising an undergraduate thesis.

Safest label: "Manuscript under review, 2026." Do not write "to appear," "accepted," or "forthcoming," and do not count these among published papers.

## Service

Verified from the CV audit: reviewer for CHI, UIST, CSCW, IMWUT, and ACM TiiS; UIST 2026 Poster Program Committee; outstanding-review recognition at CHI (2024, 2026) and UIST (2025) — **exact recognition wording is [CONFIRM]**. CHI 2027 Associate Chair appointment is **[CONFIRM]**.

**UIST workshop organizing is [CONFIRM] in full** — it appears nowhere in the CV audit. Kevin needs to supply: workshop title, year and venue, his role (organizer vs co-organizer), co-organizers, and the workshop URL.

## Suggested news entries to add (most recent first)

Dates and any [CONFIRM] items must come from Kevin.

- 2026-09: On the job market for tenure-track faculty and industry research positions starting 2027.
- 2026-09: Three manuscripts submitted — Sidecar, Helm, WeaveChat. [Hold until disclosure is confirmed.]
- 2026-0?: Cocoa received a **Best Paper Award at CHI 2026**. [Confirm month.]
- 2026-06: Began a student researcher role with Google DeepMind PAIR in New York. [Already on the site; add an end date if the role has ended.]
- 2025-10: ProMemAssist and StoryEnsemble presented at UIST 2025 in Busan.
- [CONFIRM]: UIST workshop organizing.

## Job-market banner

Keep it factual and short. Suggested text:

> **On the job market.** I am applying for tenure-track faculty and industry research positions for 2027. I expect to complete my PhD in June 2027. [CV] [Research statement] [Email]

Avoid claims about visa status, work authorization, or a specific available-to-start date until those are settled.

## Selected-work themes (mirroring the research statement)

If publications are grouped thematically, use the structure already argued in `latex/research-statement.tex`:

- **When AI should act** — Codellaborator, ProMemAssist, Sidecar. Gloss: "Deciding when an AI system should interrupt, and what that costs."
- **What it should show you** — IdeaSynth, Cocoa. Gloss: "Making an agent's plans and decisions into things you can edit."
- **Where your direction applies** — Helm, WeaveChat. Gloss: "Carrying a correction across tasks, agents, and sessions."

Earlier work (SemanticOn, DiLogics) can sit under a short "Foundations: specifying intent for automation" heading.

## Claims that must not appear on the site

From the paper audits in `evidence/paper-evidence.md`:

- Codellaborator did not make programmers faster overall; the measured gain was interpretation time per AI response.
- IdeaSynth did not improve idea quality ratings; it improved reported exploration and expansion.
- ProMemAssist was not rated better-timed or less interrupting; it delivered fewer messages with a higher engagement rate and lower frustration.
- Cocoa's ease-of-use result was a null, not a demonstration of equivalence.
- Sidecar increased mental demand alongside its attention benefits.

Plain descriptions of what each system does are safer on a website than quantitative claims.
