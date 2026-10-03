# ProcureFit · Alameda County and East Bay contracts, explained in your language

A procurement opportunity navigator for small businesses selling to Alameda County, its 14 cities and the East Bay
agencies around them. Built for the OTW 10X Hackathon challenge
**"Procurement: help small, local businesses find, understand and win County contracts."**

Tell ProcureFit what your business does (or let it read your website or capability statement). It shows which
solicitations fit, *why* they fit (with the solicitation's own words as evidence), how much effort a bid is likely to
take, what you would need, and exactly what to do before each deadline, in any of the Bay Area's languages.
It never decides eligibility; it compares what a solicitation says with what you told it, and says so.

ProcureFit is an independent hackathon prototype. It is not affiliated with, or endorsed by, Alameda County or any
agency it lists; agency names identify where opportunities are posted.

---

## 1. How to run

```bash
cd procurement-navigator
npm install
npm run dev
```

Open http://localhost:3000. Pick a demo business (or describe your own) and you land on the dashboard. Other pages:
`/passport` (Regional SLEB Passport), `/paste` (paste a solicitation), `/sources` (where we look).

Optional configuration (copy `.env.example` to `.env.local`):

| Variable | Effect |
|---|---|
| `ANTHROPIC_API_KEY` | Turns on Claude for three server routes: solicitation extraction (`/api/extract`), profile autofill (`/api/profile-extract`) and translation of generated text (`/api/translate`). Without it, deterministic pattern-based extraction runs, autofill still works by pattern matching, and summaries stay in English while the interface labels still switch language. Every extracted fact must quote its source text or it is dropped, with or without the key. |
| `NEXT_PUBLIC_DEMO_TODAY` | Pins "today" (YYYY-MM-DD) so deadlines and countdowns stay stable in a demo. The sample data is built around **2026-10-03**. Leave blank for the real date. |

Checks:

```bash
npm test            # 85 vitest tests: data, engine, fit score, similarity, passport, set-aside mechanisms, extraction, profile autofill
npm run build       # Next.js production build
npm run lint
npm run fetch-attachments   # re-pull solicitation documents from the County (see §2)
```

**Deploy (Vercel).** A standard Next.js project; the only server pieces are the three API routes. From the project
directory:

```bash
npx vercel deploy --prod --yes --build-env NEXT_PUBLIC_DEMO_TODAY=2026-10-03 --env NEXT_PUBLIC_DEMO_TODAY=2026-10-03
```

Add `ANTHROPIC_API_KEY` in the Vercel project settings to turn on Claude in production. Without a Vercel login,
`npx vercel deploy --temporary` creates a claimable preview that lives for an hour.

Stack: Next.js 16 (App Router, TypeScript, Tailwind v4), zod, vitest, `@anthropic-ai/sdk` (server routes only).
No database, no auth: the business profile, pasted solicitations, checklist ticks, language choice and translation
cache live in `localStorage`. No vendor data is stored server-side.

---

## 2. Architecture

```
src/lib/data/            DATA      schema (zod), 70 solicitations, 51-buyer registry, programs, certifications, mechanisms, glossary, synonyms, brand
src/lib/engine/          MATCHING  category inference, rules -> evidence, classification, fit-score, similarity, dashboard, passport
src/lib/engine/          EXPLAIN   explain.ts (six-section summary), checklist.ts (dated plan)
src/lib/engine/extract/  PASTE     quote-verified solicitation extraction: Claude or heuristic -> shared materialize()
src/lib/engine/profile/  AUTOFILL  quote-verified profile extraction from a website or capability statement
src/lib/engine/translate/          Claude translation of generated text (server only)
src/lib/i18n/            LANGUAGE  dictionaries for the interface; locale list for the Bay Area
src/app + components     UI        landing/profile, dashboard (chips + wording match), detail (+ one-page brief, teaming), passport, paste, sources, pitch
src/state/               STATE     profile.tsx (profile, pasted, ticks) and language.tsx (locale, translation cache)
scripts/fetch-attachments.mjs      pulls solicitation documents into public/docs
tests/                             vitest
```

**Data model.** `Solicitation` is a zod schema (`src/lib/data/types.ts`): category and secondary categories, estimated
value with its *basis*, dates as `{date, time}` (pre-bid meeting with `mandatory` flag and optional prerequisite,
site visit, questions due, submission due, award), submission method, requirements (licenses, certifications with
`required` vs preferred, insurance limits, location rule, experience, bonding, prevailing/living wage, DIR, stated
minimum staffing, other), documents to submit, `attachments` (files copied into the portal) and `portalUrl`, scope
tags, contact, source URL, source excerpt, status, `listingOnly`, and `provenance`. Every requirement carries a
`quote`; a test asserts each quote appears in its record's `sourceExcerpt`.

**Dataset (70 records, 51 buyers).** 17 records read from real County solicitation packages, 32 curated records in
the same County format (fictional contacts at `@acgov.example`), 9 curated regional records that exercise every
set-aside mechanism (Port VSBE set-aside, Caltrans DVBE goal and SB preference, UC Small Business First, two federal
total small business set-asides, EBMUD's 7% discount, Oakland's 50% L/SLBE requirement, HUD Section 3, a County
purchase at or under $25,000; `src/lib/data/solicitations.regional.ts`, contacts on `.example` domains), and 12
listing-only records from other agencies' portals. `src/lib/data/agencies.ts` registers 51 buyers: 26 County departments, commissions, districts, JPAs,
authorities and courts (links read on 2026-10-03), plus the 14 cities, BART, Port of Oakland, EBMUD, the City of
Alameda housing authority, UC Berkeley, three school districts, Cal eProcure, Caltrans District 4 and SAM.gov. The
added entries link to the official domain only and are marked *unchecked* with a look-up note until each bids page
is read. Each agency has a `displayName`, the way it names itself, used everywhere a buyer appears.

**Solicitation documents in the portal.** `npm run fetch-attachments` maps each portal-sourced record to its County
GSA bid page, downloads the agency's PDFs into `public/docs/<id>/` (files up to 15 MB; larger ones stay linked to the
County site) and records any OpenGov project link. The detail page lists them under "Solicitation documents". As of
2026-10-03 the County's current RFPs keep their documents inside the OpenGov portal, so most records carry the portal
link; the legacy-portal RFPQ #23068 contributes five copied files and five linked ones.

**Replacing the sample data with a real feed.** `src/lib/data/sources.ts` defines `SolicitationSource`. A live
adapter fetches a listing, runs each document through `engine/extract` and returns `parseSolicitations(records)`.

---

## 3. Matching methodology

Deterministic, explainable, and honest about what it does not know.

**Category inference, synonym matching, rules → evidence, classification, paperwork effort, explanation, checklist
and paste-a-solicitation** work as before: each rule returns `Evidence` with a status (met / check / missing /
unknown / na), a confidence (stated / inferred), a label, detail, action and a `sourceRef` (field + quote + url).
`unknown` is never treated as `missing`. **Unlikely fit** if any gate rule is missing; **strong** if the trade match
is primary-to-primary, nothing is missing, no gate rule is unknown, scope and size fit and the record is not
listing-only; **possible** otherwise.

### Set-aside types (`src/lib/data/mechanisms.ts`, `src/lib/data/certifications.ts`)

"Small business set-aside" means six different things across the buyers in the registry, and a missing status
means something different under each. Every certification requirement on a solicitation carries a `mechanism`, and
the rules engine, the posting cards, the detail header, the summary, the checklist and the Passport all use the same
vocabulary:

| mechanism | what it does | what a missing status means | examples (read on 2026-10-03) |
|---|---|---|---|
| **Set-aside** | competition limited to firms holding the status (`scope: total` or `partial`) | a gate: *Set aside for X; as stated, you cannot bid as the prime* | DGS SB/DVBE Option ($5,000.01–$249,999.99, ≥2 quotes from certified SB/Micro or DVBE); UC Small Business First ($10,000–$250,000 non-construction); FAR 19.502-2 Rule of Two; Port Very Small Business Program |
| **Directed spending** | the buyer steers purchases under a threshold to certified firms, without a formal set-aside | a soft check: certified firms are asked to quote first, others are not barred | County departmental discretionary spending at or under $25,000 is directed to SLEBs |
| **Bid preference** | a percentage or points added in evaluation, or a price discount | a soft check: *you lose the N% bid preference, not the right to bid* | County SLEB 5% small + 5% local (max 10%); DGS 5% SB preference; EBMUD 7% discount up to $150,000 per contract year; Oakland 2% discount for meeting the goal; Port up to 10 points on construction |
| **Participation goal** | a share of the work must go to certified firms, or the posting's exception/good-faith route | a plan: `participationGoal` evidence with the dollar share, a teaming step on the checklist and the Teaming panel; a certified prime's own work counts | County 20% SLEB subcontracting on contracts over $25,000 (written exception on the Exceptions form); DVBE 3% goal; Oakland 50% L/SLBE (≥25% LBE + 25% SLBE) on construction ≥$100,000 |
| **Registration** | a database registration required before award, not a size test | a gate: *Requires X* | SAM.gov (federal), DIR (public works) |
| **Reporting** | a program that tracks spending | no effect | CPUC GO 156 |

`alternatives` lists other codes that satisfy the same requirement (UC accepts DGS SB/Micro, SBA small, DVBE, 8(a),
HUBZone, WOSB, SDVOSB); `goalPercent` on a preference carries the County's combined preference-plus-subcontracting
clause. The certification catalog groups statuses as county/regional, state, federal and trade, each with its
`basis` (size, location, age, ownership, registration, credential). Under California Constitution art. I, § 31 every
state and local status here is size, location or age based; federal ownership programs (8(a), SDVOSB, WOSB, HUBZone)
appear only on the federal lane and only when a solicitation states them. Nothing uses a status as a proxy for award
odds: a set-aside blocks with the agency's sentence, a preference never earns more than 4 of 100 points, and goals,
registrations and directed spending never change the score at all.

The dashboard chip **Your certifications count** lists open postings where a program status you hold is met; the
**Describe the work in your own words** box ranks the list by TF-IDF wording overlap computed in the browser (it
re-orders, never scores). Every detail page has a printable one-page **brief** (`?brief=1`) and, where a goal is
stated, a **Teaming** panel with the dollar share, the program's official directory link and a draft outreach note
(ProcureFit keeps no vendor list and sends nothing). `/pitch` maps the build to the hackathon's five judging criteria.

### Bid Effort Fit (`src/lib/engine/fit-score.ts`, scoring v1.0.0)

An explainable 0 to 100 effort score built on top of the rules, which remain the authority on every requirement.

| Component | Max | What earns points |
|---|---|---|
| Scope match | 35 | trade match by strength (8–20), capability match (+5), lexical similarity (0–10), minus 6 when the scope covers trades you lack |
| Readiness | 35 | license 10, certifications and DIR 8, insurance 7, experience 5, staffing 5; met = full, check = half, unknown = 0; a requirement the solicitation does not state earns its full weight; listing-only records score 0 |
| Commercial | 15 | contract size met 9 / unknown 4 / stretch 3; paperwork effort low 6 / medium 3 / high 0 |
| Local & timing | 15 | location met 5 / none stated 4 / check 1; stated preference programs up to 4; days left 1–6 |

- **Blocked** (no number): any gate rule the vendor affirmatively fails: closed, mandatory meeting already held,
  wrong trade, county-required location, a declared missing license, certification, experience or staffing. The UI
  shows the exact source quote in place of the number. Absent profile information is *unknown*: it lowers
  confidence and never blocks.
- **Confidence** is separate from the score: *low* for listing-only or thin text, two or more unknown gate
  requirements, or a trade match that is not source-backed; *high* when every gate requirement, insurance and DIR
  are answered; *medium* otherwise.
- **Recommendation**: Strong fit (strong tier, score ≥ 70, not low confidence) · Worth a closer look ·
  High verification effort (low confidence or score < 45) · Blocked as stated. A test rejects any label or detail
  containing "eligible", "qualifies", "qualify", "will win" or "guaranteed".
- **Lexical similarity** (`similarity.ts`): TF-IDF cosine between the solicitation text and the vendor's own
  description, capabilities and keywords, computed in-process over the built-in corpus (memoized per corpus and per
  record, deterministic summation). It feeds only the scope component, is capped at 10 points, and is computed after
  blocking has been decided, so it can never override a rule. The UI calls it "wording overlap".
- **Protected status is never a proxy for award odds.** The only path that awards points for a certification program
  is the `certPreferred` rule, which fires only when the solicitation itself states the program as preferred, capped
  at 4 of 100; nothing in the score reads the profile's certifications directly.
- **Auditability**: every result carries `inputs` (evidence ids and statuses, the similarity value and shared terms,
  which profile fields were declared) and `scoringVersion`. All of it stays in the browser.
- The disclaimer on every panel: *Guidance only, not an eligibility determination or award prediction. The agency
  decides after reading your full response.*

**Dashboard** (`dashboard.ts`): Top matches, then one filterable list with quick-filter chips that reuse the section
predicates: All · Closing soon (candidates due within 14 days) · Easy wins (low paperwork, size in range, not listing
only) · Larger (trade fits, size is a stretch) · Blocked (trade fits, one stated requirement missing). More filters
(category, buyer, department, deadline, size, certification mentioned, match strength, show closed) sit behind a
disclosure; "Requirements you commonly lack" and the Passport credibility card sit at the bottom.

### Profile autofill (`src/lib/engine/profile/extract.ts`, `/api/profile-extract`)

Give a public web address or paste a capability statement (or upload a `.txt`). The server fetches the page (public
http(s) only, 2 MB cap, HTML stripped to text), then Claude or the heuristic parser produce a draft profile: name,
description, city and county (Alameda County cities recognized), headcount, years in business, services, NAICS
keywords, CSLB license classes, certifications from the shared catalog, insurance types and the inferred trade. Every
fact carries a quote; `verifyDraft()` drops anything whose quote is not in the text. The form is prefilled and the
owner checks every field before saving.

### Languages

The header toggle lists the Bay Area's languages as Alameda County lists them for language access. English, Spanish,
Chinese (Traditional and Simplified), Vietnamese, Tagalog and Korean have hand-written interface dictionaries
(`src/lib/i18n/strings.ts`). Farsi, Punjabi, Arabic, Hindi, Khmer, Tigrinya, Amharic, Japanese, Russian, Portuguese,
Thai, Lao, Burmese and Mongolian get their interface strings from the live translation route and fall back to English
without a server key. Generated text (summaries, evidence lines) is translated through `/api/translate` (Claude) and
cached per language in the browser; the page always says *Machine translation. The English posting governs.*
Right-to-left languages set the document direction. Spoken-only languages (Mien, Mam) have no written standard to
render and are not listed.

---

## 4. Regional SLEB Passport (`/passport`)

Alameda County's SLEB program (small, local, emerging: up to a 10% preference, 20% SLEB subcontracting on larger
contracts) is one of a dozen overlapping programs across the region. The Passport encodes them as data
(`src/lib/data/programs.ts`) on a **shared status taxonomy**:

| Status | Definition | Derived from (self-reported, unverified) |
|---|---|---|
| County-local | fixed office in Alameda County, business license, six months there | county on the profile |
| City-local | located in the buying city under its own definition | city on the profile (14 cities) |
| Small | at or under the SBA size standard | headcount ≤ 100 |
| Emerging | small, under five years, ≤ half the SBA threshold (County SLEB) | headcount ≤ 50 and < 5 years |
| Micro | DGS microbusiness | headcount ≤ 25 |
| State-certified | DGS SB, MB, SB-PW, DVBE | a listed DGS certification |
| Federal-certified | DBE, Section 3, WOSB, HUBZone, 8(a) | a listed federal certification |

Programs: County SLEB, Alameda CTC LBCE (LBE/SLBE/VSLBE, local funds only), City of Oakland L/SLBE, Port of Oakland
SBE/VSBE, AC Transit SBE/SLBE and DBE, BART SBE/MSBE/Local Small Business, EBMUD Contract Equity (accepts DGS SB/MB;
7% discount), OUSD Local Business Utilization (2% discount; accepts County, Oakland, Port and Alameda CTC
certifications for Oakland-based firms), UC Berkeley Small Business First, HACA Section 3, city preferences (Alameda
5%, Berkeley 5%, Fremont 2.5% goods, San Leandro 10% up to $50k, Pleasanton 5% capped at $5k), California DGS
SB/MB/DVBE, SAM.gov, the federal DBE program (October 2025 rule; California reevaluating), CPUC GO 156 and the East
Bay Interagency Alliance common application (information-sharing, not reciprocal certification).

For each program the page shows a **standing**: *Recognized* (you listed a certification the program issues or
accepts; not verified), *Likely to apply* (your self-reported size and location match what it recognizes), *Not
derivable from your profile* (ownership- or income-based, or a field is missing), *Not applicable* (outside its
boundary). `src/lib/engine/passport.ts` is pure and tested.

**Harmonization proposal.** One application and shared evidence → a common supplier profile with status codes →
each agency applies its own boundary, funding lane and bid rule → a shared directory and outcome dashboard. The
proposed **Regional SLEB alumni badge** (a supplier that held an active small-local certification for a full term,
completed a public contract in good standing and has since outgrown the size threshold) would confer a portable,
verifiable history, mentor/prime listing for subcontracting goals and inclusion in shared metrics. It would not confer
any preference, set-aside, discount, certification or eligibility with any agency.

**Legal guardrail.** California Constitution Art. I §31 (Prop 209; *Hi-Voltage Wire Works v. City of San Jose*) bars
race- and sex-based preferences in public contracting. Every status here is based on size, location or age of the
business; ownership-diversity information never changes a score, preference or standing in this tool.

`/passport?slide=1` renders the same page as one 16:9 slide (header and footer hidden); the print stylesheet does the
same for Cmd+P. Program pages whose URL was not read on 2026-10-03 are marked *unchecked link*: Oakland L/SLBE, Port
SBE/VSBE, BART OCR, EBMUD Contract Equity, OUSD policy, UC Berkeley Small Business First, DGS OSDS, US DOT DBE, CPUC GO
156, the Alliance page, and the city preference pages.

---

## 5. Naming and branding

The product is **ProcureFit** (`src/lib/data/brand.ts`): a gradient mark from County green to Bay blue, a serif
display face for headings, and a cream/green/amber/blue palette. Agencies are named the way they name themselves
(`Agency.displayName`) and shown as text marks tinted by kind of buyer (county, city, regional, school district,
state, federal). No agency seal or logo is reproduced; the footer states non-affiliation.

---

## 6. Three-minute demo script

| time | what to do | what to say |
|---|---|---|
| 0:00 | Landing page. Click **Hernández Electric** (⚡). | "An East Oakland electrician with 12 people, a C-10 license, no SLEB certification, and no idea where County work is posted." |
| 0:20 | Dashboard. Point at the score chips on **Top matches**, then the quick-filter chips. | "Every card carries a Bid Effort Fit score with its confidence, and the reasons. One list, five chips: closing soon, easy wins, larger, blocked." |
| 0:50 | Open **LED lighting retrofit**. | "83 out of 100, worth the effort. Four bars say where the points come from. Check-before-you-commit and Tell-us lists, each line with the quote." Switch the language toggle to Español. |
| 1:30 | Scroll to **In your language** and **Your plan**. Tick two checklist items. Reload. | "Six sections, traceable to the solicitation. The plan is dated with County holidays. Ticks stay on this device." |
| 1:50 | Back. Chip **Blocked** → the as-needed electrical contract. | "Mandatory job walk already happened. Blocked as stated, and the quote replaces the number." |
| 2:00 | Chip **Your certifications count** → open the **Coast Guard grounds** or **UC help desk** record. | "Set-aside, preference, goal, directed spending: each gets its own label, so a missing certification reads as a gate, a scoring loss or a teaming plan, never a guess." |
| 2:10 | Header "change business" → **Bayline Builders**. Open **SLEB Passport**. | "Fremont GC, SLEB certified. Recognized by the County, likely to apply for Fremont's preference, not applicable in Oakland. The proposal: one application, one alumni badge, each agency keeps its rule." Click **Print / slide view**. |
| 2:40 | **Describe your own business** → paste a capability statement → **Autofill**. | "Website or capability statement in, profile out, every field with a quote." |
| 2:55 | **Where we look**. | "51 buyers: the County, 14 cities, BART, the Port, EBMUD, school districts, state and federal entry points." |

---

## 7. With two more hours

**Wire the first live source.** `SolicitationSource`, the quote-verified extraction pipeline and the attachment
fetcher already exist; what is missing is one adapter that walks the County GSA listing, reads each document and
returns `parseSolicitations(records)` on a nightly refresh. Second choice: an OpenGov adapter, since that is where
the County's current documents live.

**Phase 2 similarity (design note, deferred).** Replace TF-IDF with embeddings only if it measurably improves
ordering on the demo corpus. Design: an embedding provider called server-side with explicit consent per profile, no
retention of vendor text beyond the request, precomputed solicitation vectors shipped with the dataset, the same
10-point cap and the same rule that similarity never overrides a hard requirement.

---

## Known limitations

- The dataset mixes real and curated records; curated contacts are fictional and marked "sample".
- Listing-only records have no requirements until a document is read; the County's current RFP documents live
  inside OpenGov and are linked, not copied.
- Passport status tags are heuristics from headcount, years and city; program rules are summaries that change.
  Unchecked links are marked.
- Interface dictionaries beyond the first seven languages come from live translation; everything non-English says
  the English posting governs.
- Profile, pasted records, ticks and language are per-browser (`localStorage`). No PDF upload yet (paste the text).
- Demo dates assume today is 2026-10-03 (`NEXT_PUBLIC_DEMO_TODAY`).
