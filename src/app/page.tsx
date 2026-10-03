import Link from "next/link";
import { DemoProfilePicker } from "@/components/profile/DemoProfilePicker";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Hero } from "@/components/home/Hero";
import { SOLICITATIONS } from "@/lib/data/solicitations";
import { AGENCIES, GOVERNANCE_LABELS, type Governance } from "@/lib/data/agencies";
import { BRAND } from "@/lib/data/brand";
import { Disclosure, EntityMark, Eyebrow } from "@/components/ui";

const STRIP_ORDER: Governance[] = ["county-department", "city", "regional", "special-district", "jpa", "authority", "school-district", "state", "federal"];
const STRIP_LIMIT = 18;

export default function Home() {
  const open = SOLICITATIONS.filter((s) => s.status === "open").length;
  const portal = SOLICITATIONS.filter((s) => s.provenance.source === "portal").length;
  const strip = STRIP_ORDER.flatMap((g) => AGENCIES.filter((a) => a.governance === g).slice(0, g === "city" ? 6 : 3)).slice(0, STRIP_LIMIT);
  return (
    <div>
      <section className="hero-wash">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <Hero open={open} portal={portal} buyers={AGENCIES.length} />
          <div className="mt-10">
            <h2 className="text-base font-semibold text-ink">Try it as…</h2>
            <p className="text-sm text-muted mb-3">Pick a demo business and jump straight to its matches.</p>
            <DemoProfilePicker />
          </div>
          <div className="mt-6">
            <Disclosure id="describe" summary="Describe your own business" className="scroll-mt-24">
              <p className="text-sm text-muted mb-4">
                Seven quick questions, or autofill from your website or capability statement. Skip what you don&apos;t know; we flag it instead of guessing.
                Nothing leaves your browser except the text you choose to autofill from.
              </p>
              <ProfileForm />
            </Disclosure>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 space-y-8 pb-8">
        <section aria-labelledby="buyers-title">
          <Eyebrow>Buyers we cover</Eyebrow>
          <h2 id="buyers-title" className="font-display text-2xl font-semibold text-ink">
            Alameda County, its 14 cities, and the East Bay agencies around them
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {strip.map((a) => (
              <li key={a.id} className="card px-3 py-2">
                <EntityMark agency={a} showGovernance />
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted mt-3">
            {AGENCIES.length - strip.length} more, grouped by {Object.keys(GOVERNANCE_LABELS).length} kinds of buyer, on{" "}
            <Link href="/sources" className="text-green underline">
              Where we look
            </Link>
            . Agency names identify where postings live; {BRAND.product} is not affiliated with any of them.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { t: "Which ones fit, and why", d: "Every match shows its evidence: the license they ask for, the size, the location, the certification you haven't listed. No mystery score." },
            { t: "Bid Effort Fit", d: "A 0 to 100 effort guide with every point explained, a separate confidence level, and the exact quote when something blocks you." },
            { t: "What to do, by when", d: "A dated checklist from the solicitation itself: register, attend the mandatory meeting, gather documents, submit by 2:00 p.m." },
          ].map((f) => (
            <div key={f.t} className="card p-5">
              <h3 className="font-semibold text-ink">{f.t}</h3>
              <p className="text-sm text-muted mt-1">{f.d}</p>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}
