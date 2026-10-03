import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/data/brand";
import { SOLICITATIONS } from "@/lib/data/solicitations";
import { AGENCIES } from "@/lib/data/agencies";
import { PROGRAMS } from "@/lib/data/programs";
import { LOCALES } from "@/lib/i18n/strings";
import { Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: `Two-minute pitch · ${BRAND.product}`,
  description: `How ${BRAND.product} maps to the ${BRAND.challenge} rubric, with the demo script.`,
};

const RUBRIC: { key: string; question: string; evidence: string[]; show: string }[] = [
  {
    key: "Problem fit",
    question: "Does it take on a real county or city challenge? Does it name who it's for and how those people use it?",
    evidence: [
      `The County's stated challenge: “${BRAND.challengeStatement}.”`,
      "For small East Bay firms: nine demo businesses (an East Oakland electrician, a Fremont general contractor, a Hayward janitorial company, a Berkeley IT shop, an Oakland translator, a caterer, a designer, a landscaper, a counseling nonprofit) stand in for the real audience.",
      "How they use it: pick or describe a business, see which postings fit and why, open the dated plan, print a one-page brief, and check the Passport for which programs recognize them.",
    ],
    show: "Landing page: pick Hernández Electric. Dashboard: top matches with evidence.",
  },
  {
    key: "Hardest or riskiest piece",
    question: "What is the hardest or riskiest piece, and does the solution address it with evidence?",
    evidence: [
      "Being right without inventing anything. Every requirement in the dataset carries a verbatim quote, and a test fails the build if the quote is not in the source text. Pasted solicitations and autofilled profiles keep only facts whose quote can be found.",
      "A blocker never becomes a number: the page shows the agency's own sentence in place of a score.",
      "Set-asides are modelled by mechanism, not lumped together: a set-aside limits who may bid, a preference only changes scoring, a participation goal is work to plan, directed spending steers quotes. The County, DGS, UC, EBMUD, Port, Oakland and FAR pages were read on Oct 3, 2026 and are cited on the Passport.",
    ],
    show: "The as-needed electrical job: “Blocked as stated” with the mandatory job-walk quote. Then the federal custodial posting: set-aside badge, SAM.gov requirement.",
  },
  {
    key: "Prototype",
    question: "What does the prototype look like now? Does it function?",
    evidence: [
      `${SOLICITATIONS.length} postings (${SOLICITATIONS.filter((s) => s.provenance.source === "portal").length} entered from real County documents), ${AGENCIES.length} buyers in the registry, ${PROGRAMS.length} programs on the Passport, ${LOCALES.length} Bay Area languages.`,
      "Working end to end in the browser: matching, Bid Effort Fit, the dated checklist with saved ticks, paste-a-solicitation extraction, profile autofill from a website, the one-page brief, teaming help for participation goals, and the slide-ready Passport.",
      "Deployed on Vercel from a public repository, with a test suite that runs on every change.",
    ],
    show: "Dashboard chips: Your certifications count. Describe the work in your own words: rank by wording.",
  },
  {
    key: "Safety",
    question: "Is this safe for the people using or affected by the solution?",
    evidence: [
      "No eligibility claims and no award odds. The score is labelled an effort guide; the test suite rejects the words eligible, qualifies, will win and guaranteed anywhere in the output.",
      "Ownership-based statuses never earn points. Every state and local status is size, location or age based (California Constitution art. I, § 31); federal ownership programs appear only when a solicitation states them.",
      "The business profile stays in the browser. The only network calls are the ones you choose: autofill from a URL you give, and translation of generated text when a key is configured. Sample records are labelled; agency names identify where postings live, and no seal or logo is reproduced.",
    ],
    show: "Footer disclaimer, the Passport legal note, and the “self-reported, unverified” tags.",
  },
  {
    key: "Real-world use",
    question: "Could the county or city actually try this as a working system?",
    evidence: [
      "Data comes from the County's own OpenGov portal and legacy bid pages; the fetch script copies solicitation documents where the County exposes them.",
      "The Regional SLEB Passport is a concrete harmonization proposal: one application, shared status codes, each agency keeping its own rule, and an alumni badge that carries history without conferring any preference.",
      "To pilot: a posting feed from OpenGov, a County-hosted translation key, and permission to show agency marks. Everything else already runs.",
    ],
    show: "Passport slide view for Bayline Builders, then the mechanisms legend.",
  },
];

const SCRIPT: { at: string; title: string; text: string }[] = [
  {
    at: "0:00",
    title: "The stake",
    text: "A small East Bay contractor loses a County bid before writing a word: twenty unpaid hours in an eighty-page packet, then a mandatory job walk they missed on page sixty. ProcureFit reads the packet first and tells them, in their language, whether this one is worth their evening.",
  },
  {
    at: "0:30",
    title: "The hard part, shown",
    text: "Open Hernández Electric. The LED retrofit scores 83 of 100 with every point explained. The as-needed repair contract does not get a number at all: it shows the County's own sentence about the job walk that already happened. Nothing on this screen was invented; every line links to the words it came from.",
  },
  {
    at: "1:05",
    title: "Set-asides, by type",
    text: "The County's SLEB rule is three mechanisms, not one: a ten percent preference, a twenty percent subcontracting share for primes that are not certified, and directed spending at or under twenty-five thousand dollars. The State's SB/DVBE Option, UC's Small Business First, EBMUD's set-aside and the federal Rule of Two each get the right label, so a vendor knows whether a missing certification blocks them, costs them points, or means finding a partner. The Passport shows which programs recognize them today and proposes one application for all of them.",
  },
  {
    at: "1:40",
    title: "Real-world use",
    text: "It runs on the County's own postings and the programs' own pages, checked this week. A pilot needs a feed and a translation key, not a rebuild. Every small firm that bids on the right contract instead of the wrong one is a step toward Vision 2036's goal of employment for all.",
  },
];

export default function PitchPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-10">
      <header>
        <Eyebrow>{BRAND.challenge} · for judges</Eyebrow>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-tight">Two minutes, five criteria</h1>
        <p className="text-muted mt-3 max-w-2xl">
          {BRAND.product} answers the County&apos;s procurement challenge for small local businesses. This page maps what works today onto the hackathon&apos;s five
          judging criteria and gives the spoken script. Built for {BRAND.challenge}, convened with {BRAND.partners}, in support of the {BRAND.vision.program} 10X goal{" "}
          <a href={BRAND.vision.url} target="_blank" rel="noreferrer" className="underline">
            {BRAND.vision.goal}
          </a>
          .
        </p>
      </header>

      <section aria-labelledby="rubric-title" className="space-y-4">
        <h2 id="rubric-title" className="font-display text-2xl font-semibold text-ink">
          Rubric, criterion by criterion
        </h2>
        {RUBRIC.map((r, i) => (
          <article key={r.key} className="card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold text-ink">
                {i + 1}. {r.key}
              </h3>
              <span className="text-xs text-muted shrink-0">5 points</span>
            </div>
            <p className="text-sm text-muted italic mt-1">“{r.question}”</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink/90 list-disc pl-5">
              {r.evidence.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              <span className="font-medium text-ink">Show:</span> {r.show}
            </p>
          </article>
        ))}
      </section>

      <section aria-labelledby="script-title" className="space-y-4">
        <h2 id="script-title" className="font-display text-2xl font-semibold text-ink">
          The spoken pitch
        </h2>
        <ol className="space-y-3">
          {SCRIPT.map((s) => (
            <li key={s.at} className="card p-5 grid gap-2 sm:grid-cols-[4rem_1fr]">
              <span className="font-display text-xl font-semibold text-green tabular-nums">{s.at}</span>
              <div>
                <h3 className="font-semibold text-ink">{s.title}</h3>
                <p className="text-sm text-ink/90 mt-1">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="not-title" className="card p-5">
        <h2 id="not-title" className="font-semibold text-ink">
          What we chose not to build
        </h2>
        <ul className="mt-2 space-y-1.5 text-sm text-ink/90 list-disc pl-5">
          <li>Win probabilities. No one can promise a public contract, and a number that pretends to is a liability for the business reading it.</li>
          <li>A marketplace of unverified vendors. Teaming help points to each program&apos;s official certified-firm directory and drafts the outreach note; it does not list firms we cannot vouch for.</li>
          <li>A model download. Wording match runs on a term-weighted index built in the browser, so it works on conference Wi-Fi and sends nothing anywhere.</li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          Start the demo on the{" "}
          <Link href="/" className="text-green underline">
            landing page
          </Link>
          , or open the{" "}
          <Link href="/passport?slide=1" className="text-green underline">
            Passport slide
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
