# BidPath · Alameda County contracts in plain English

A procurement opportunity navigator for small Alameda County businesses, built for the OTW 10X Hackathon challenge
**"Procurement: help small, local businesses find, understand and win County contracts."**

Tell BidPath what your business does. It shows which County and local-agency solicitations fit, *why* they fit (with the
solicitation's own words as evidence), what you would need to qualify, and exactly what to do before each deadline.
It never decides eligibility; it compares what a solicitation says with what you told it, and says so.

---

## 1. How to run

```bash
cd procurement-navigator
npm install
npm run dev
```

Open http://localhost:3000. Pick a demo business (or describe your own) and you land on the dashboard.

Optional configuration (copy `.env.example` to `.env.local`):

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | "Paste a solicitation" uses Claude for extraction. Without it, a deterministic pattern-based parser runs. Either way every extracted fact must quote the pasted text or it is dropped. |
| `NEXT_PUBLIC_DEMO_TODAY` | Pins "today" (YYYY-MM-DD) so deadlines and countdowns stay stable in a demo. The sample data is built around **2026-10-03**. Leave blank for the real date. |

Checks:

```bash
npm test            # 35 vitest tests: data integrity (T0) + engine (T1–T8) + extraction (T9)
npm run build       # Next.js production build
npm run lint
```

Stack: Next.js 16 (App Router, TypeScript, Tailwind v4), zod, vitest, `@anthropic-ai/sdk` (extraction route only).
No database, no auth: the business profile, pasted solicitations and checklist ticks live in `localStorage`.

---

## 2. Architecture

Four layers, separated so any one can be swapped:

```
src/lib/data/        DATA        schema (zod), 61 solicitations, 26-agency registry, glossary, synonyms, demo profiles
src/lib/engine/      MATCHING    category inference, rules -> evidence, classification, dashboard sections, filters
src/lib/engine/      EXPLAIN     explain.ts (six-section plain-language summary), checklist.ts (dated plan)
src/lib/engine/extract/  PASTE   quote-verified extraction: Claude or heuristic -> shared materialize()
src/app + components UI          landing/profile, dashboard, opportunity detail, paste, "where we look"
src/state/profile.tsx            client state + localStorage; runs the engine on [pasted..., SOLICITATIONS]
tests/                           vitest
```

**Data model.** `Solicitation` is a zod schema (`src/lib/data/types.ts`) with structured fields the brief asks for:
category + secondary categories, estimated value with its *basis* (total / annual / per-order / not-to-exceed pool),
dates as `{date, time}` in Pacific time (pre-bid meeting with `mandatory` flag and optional prerequisite form,
site visit, questions due, submission due, award), submission method, requirements (licenses, certifications
with `required` vs preferred, insurance limits, location rule, experience, bonding, prevailing/living wage, DIR,
stated minimum staffing, other), documents to submit, scope tags, contact, source URL, source excerpt, status,
`listingOnly`, and `provenance` (curated / portal / pasted, extracted by human / claude / heuristic).
Every requirement carries a `quote`; a test asserts each quote appears in its record's `sourceExcerpt`, which is the
mechanical guarantee behind "never invent requirements".

**Dataset (61 records, 26 agencies).**
- 17 records read from real County solicitation packages (GSA, Health Care Services, Behavioral Health, Public Health,
  Probation, Housing) with real numbers, dates, contacts, insurance limits, Exhibit A document lists and SLEB terms.
- 32 curated records written in the same County format (fictional contacts at `@acgov.example`), spread across the
  trades the brief names so every demo profile has strong, possible and blocked matches.
- 12 listing-only records captured from other agencies' portals (Alameda CTC, HCD SHIFT, Superior Court, Office of
  Education, East Bay Regional Park District, First 5, StopWaste). They are shown with a "listing only" tag and
  their requirements are honestly empty.
- `src/lib/data/agencies.ts` is a registry of 26 "technically Alameda County" buyers (departments, commissions,
  County-governed districts, JPAs, courts, two regional agencies) with their procurement URL, platform, preference
  program and the kind of ingest adapter each needs. The "Where we look" page renders it.

**Replacing the sample data with a real feed.** `src/lib/data/sources.ts` defines `SolicitationSource { load(): Promise<Solicitation[]> }`.
The sample set is one source; `countyPortalSource` is a documented stub. A live adapter fetches a listing, runs each
document through `engine/extract` (the same quote-verified pipeline the paste feature uses) and returns
`parseSolicitations(records)`. Nothing downstream changes.

**CivicBridge workspace prototype** (`public/civicbridge.html`, served at `/civicbridge.html`, linked from the nav as
"County workspace"). A single-file HTML prototype of the wider County workspace BidPath belongs to: a countywide
contract finder with category / supplier / area filters and a stated-SLEB-preference quick filter, a sample bid card
with tabbed scope, dates, requirements and an eligibility check whose facts cite page-level evidence, a quote builder
with downloadable draft and calendar export, a whole-person service timeline with example sharing scopes, an
explainable housing-project rubric with shortlist and review-packet export, and a housing-investment mix tool. All of
its data is synthetic and labelled as such. It links into BidPath ("Open BidPath matching") and BidPath links back.

**UI.** Cream/green/amber palette, conversational copy, semantic HTML, keyboard-reachable filters, mobile layout.
The detail page is client-rendered so pasted solicitations (browser-only) behave exactly like built-in ones.

---

## 3. Matching methodology

Deterministic, explainable, and honest about what it does not know. No opaque score is ever shown.

**Category inference** (`infer-category.ts`): declared trade → licenses (C-10 → electrical, C-36 → plumbing, B →
general construction, …) → certifications (ServSafe → food, court interpreter → translation) → synonym scoring of the
name, description, capabilities and keywords. Low-confidence results are shown as an editable chip ("We guessed your
trade as…") instead of being treated as fact.

**Synonym matching** (`synonyms.ts`): per-category strong (3) / weak (1) / negative (−3) phrases, whole-phrase regex
tolerant of hyphens and suffixes. Negatives stop "cybersecurity" → security guards, "design-build" → graphic design,
"Class B driver's license" → Class B contractor.

**Rules → evidence** (`rules.ts`). Each rule returns `Evidence` with a status, a confidence, a plain label and detail,
an action, and a `sourceRef` (field + quote + url):

| rule | class | notes |
|---|---|---|
| availability | gate | open and due date not passed |
| tradeFit | gate | category intersection (profile primary/secondary vs solicitation primary/secondary/umbrella) or synonym score |
| scopeCoverage | soft | multi-trade scope only partly covered → "you may need to team or sub" |
| capabilityMatch | soft | the owner's capability phrases found in the text |
| contractSize | soft | above the owner's usual band → *check*, worded "not an eligibility rule" |
| location | gate when county-required | local preference → check for non-County businesses |
| license / certRequired / experience / statedStaffing | gate | missing only when the profile *declares* it lacks the item |
| certPreferred | soft | "you lose the preference, not eligibility" |
| insurance | soft | never a blocker: certificates are due at award, brokers add coverage |
| bonding, prevailingWage, livingWage, dirRegistration | soft | always a check item with glossary guidance |
| mandatoryMeeting | gate when the meeting already happened | future mandatory meeting → check |
| listingOnly | soft | "open the posting; requirements not read yet" |

Statuses: **met**, **check**, **missing**, **unknown** (the profile did not say; phrased "Tell us"), **na**.
`unknown` is never treated as `missing`. Confidence is **stated** when the solicitation states the requirement and the
owner's trade/credential was user- or license-sourced, otherwise **inferred**.

**Classification** (`classify.ts`):
- **Unlikely fit** if any gate rule is *missing* (the blockers are listed and explained).
- **Looks like a strong fit** if the trade match is primary-to-primary (score ≥ 7), nothing is missing, no gate rule is
  unknown, the scope is fully covered, the size is not a stretch and the record is not listing-only.
- **Possible fit** otherwise, with "N things to verify".
- A `fitScore` orders cards (trade +, size +, location +, per missing −, per check −) and is never displayed.
- **Paperwork effort** (low/medium/high, labelled "our estimate") counts bonds, mandatory meetings, prevailing wage,
  required certifications, document count and multi-trade scope.

**Dashboard** (`dashboard.ts`): Top Matches (strong, backfilled with possible and labelled when fewer than three),
Closing Soon (≤ 14 days), Easy Wins (low paperwork, size in range), Larger Opportunities (trade fits, size is a stretch:
teaming/subcontracting wording), Your Trade But Blocked, and Requirements You Commonly Lack (evidence grouped by
requirement key into Missing / Check these / Tell us, with glossary meaning, action and lead time). Filters: category,
agency, department, deadline window, size bucket, certification mentioned, match strength, search, show closed.

**Explanation** (`explain.ts`, `glossary.ts`): the six sections (What they need / How much / Who can bid / What you
must submit / Important dates / Watch out) are generated only from structured fields, each line with a source
reference. ~40 glossary entries (SLEB, DIR, prevailing wage, bonds, Exhibit A, insurance types, CSLB classes, …) give
meaning, next action, lead time and whether lacking the item can stop a bid. Dollar/percentage figures are quoted
from current County language and the UI says to confirm on the solicitation.

**Checklist** (`checklist.ts`): calendar-date arithmetic with County-holiday-aware business days. Groups: Get ready
(2 business days before the first meeting, else 10 before the due date), clearance form, meetings (mandatory vs
optional), questions, Prepare your response (3 business days before, one item per required document), Submit.
Past prep groups collapse into "Do now"; a past mandatory meeting becomes a warning. Each item is tagged
*from the solicitation* / *general County step* / *our suggestion*. Ticks persist per solicitation and date-hash.

**Paste a solicitation** (`extract/`): Claude (structured output against the same zod draft schema) or the heuristic
parser produce a *draft* in which every fact carries a verbatim quote. `materialize()` verifies each quote against the
normalized text, drops anything unverifiable into `droppedExtractions` ("N items left out"), marks a meeting mandatory
only if the quote says "mandatory", cross-checks the category with the synonym scorer, and records a missing due date
instead of inventing one. The result is a normal `Solicitation`, so the engine, summary and checklist work unchanged.

**Safeguards the UI enforces**: "appear to meet" rather than "eligible"; every evidence line distinguishes stated vs
inferred; "Tell us" items are gaps in the profile, not the business; the footer and detail page say the County decides.

---

## 4. Three-minute demo script

| time | what to do | what to say |
|---|---|---|
| 0:00 | Landing page. Click **Hernández Electric** (⚡). | "An East Oakland electrician with 12 people, a C-10 license, no SLEB certification, and no idea where County work is posted." |
| 0:20 | Dashboard. Point at **Top matches** cards. | "Every card says *why*: license matches, DIR registered, size in range. Strong, possible, unlikely, never a mystery score." Scroll to **Closing soon** (the data cabling job due Oct 16) and **Requirements you commonly lack**: SLEB and insurance show up as *Tell us* / *Check these*. |
| 0:50 | Open **LED lighting retrofit** (top match). | Deadline header: due date, countdown, and "Next: mandatory pre-bid meeting Oct 14". **Does it fit?** rows are tagged *stated* or *inferred*. **What you'd need**: three columns, appear to meet / check these / missing. Click "Where it says this" to show the quote. |
| 1:30 | Scroll to **In plain English** and **Your plan**. Tick two checklist items. Reload. | "Six sections in everyday words, each traceable to the solicitation. The plan is dated with County holidays and business days. Ticks stay on this device." |
| 1:50 | Back. Open **Your trade, but something blocks it** → the as-needed electrical contract. | "Mandatory job walk already happened. We say you can no longer bid, and why, instead of hiding it in page 12." |
| 2:10 | Header "change business" → pick **Puente Language Services**. | "Same engine, different owner. Electrical jobs vanish; the interpretation RFP is the strong fit, with court-certification evidence." |
| 2:30 | **Paste a solicitation** → *Try a sample* → *Extract*. | "Any solicitation, from any agency. Every extracted fact must quote the text, and the two we could not verify are listed as *left out*, not guessed." Add it, show the banner and the quotes. |
| 2:55 | **Where we look**. | "The County isn't one buyer: 26 departments, commissions, districts and authorities, centralized, each tagged with the adapter a live feed needs." |

---

## 5. With two more hours

**Wire the first live source.** `SolicitationSource` and the quote-verified extraction pipeline already exist; what is
missing is one adapter: fetch the County GSA contracting-opportunities HTML listing (plain HTML, fetchable today),
download each solicitation's DOCX/PDF, convert to text, run `extractWithClaude` → `materialize()`, and cache the
validated records with a nightly refresh. That single change turns the demo into a tool a business can check every
Monday, and it exercises nothing new: the paste feature is that pipeline for one document. Second choice, if the
feed is out of reach: per-owner rephrasing of the six-section summary into the owner's own language (Spanish,
Cantonese, Vietnamese) with Claude, keeping the source quotes in English beside it.

---

## Known limitations

- The dataset is a mix of real and curated records; curated contacts are fictional and marked "sample".
- Listing-only records (other agencies' portals) have no requirements until a document is read.
- The heuristic parser handles the common County layout; unusual formats need the Claude path.
- Profile, pasted records and ticks are per-browser (`localStorage`). No PDF upload yet (paste the text).
- Demo dates assume today is 2026-10-03 (`NEXT_PUBLIC_DEMO_TODAY`).
