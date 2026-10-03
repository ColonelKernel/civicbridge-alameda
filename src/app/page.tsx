import { DemoProfilePicker } from "@/components/profile/DemoProfilePicker";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { SOLICITATIONS } from "@/lib/data/solicitations";
import { AGENCIES } from "@/lib/data/agencies";

export default function Home() {
  const open = SOLICITATIONS.filter((s) => s.status === "open").length;
  const portal = SOLICITATIONS.filter((s) => s.provenance.source === "portal").length;
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-12 sm:py-16 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-start">
        <div>
          <p className="text-sm font-medium text-green mb-3">For small businesses in Alameda County</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink leading-[1.05]">
            Government contracting, finally in plain English.
          </h1>
          <p className="mt-5 text-lg text-muted max-w-xl">
            Tell us what your business does. We&apos;ll show you which County and local-agency contracts actually fit, why they fit,
            what you&apos;d need to qualify, and exactly what to do before each deadline.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Open opportunities</dt>
              <dd className="text-2xl font-semibold text-ink">{open}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">From real postings</dt>
              <dd className="text-2xl font-semibold text-ink">{portal}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Agencies tracked</dt>
              <dd className="text-2xl font-semibold text-ink">{AGENCIES.length}</dd>
            </div>
          </dl>
          <div className="mt-10">
            <h2 className="text-base font-semibold text-ink">Try it as…</h2>
            <p className="text-sm text-muted mb-3">Pick a demo business and jump straight to its matches.</p>
            <DemoProfilePicker />
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-ink">Or describe your own business</h2>
          <p className="text-sm text-muted mt-1 mb-5">Seven quick questions. Skip what you don&apos;t know; we&apos;ll flag it instead of guessing.</p>
          <ProfileForm />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3 pb-8">
        {[
          { t: "Which ones fit, and why", d: "Every match shows its evidence: the license they ask for, the size, the location, the certification you haven't listed. No mystery score." },
          { t: "What you'd need", d: "Requirements sorted into what you appear to meet, what to check, and what's missing, each with a plain explanation and a next step." },
          { t: "What to do, by when", d: "A dated checklist from the solicitation itself: register, attend the mandatory meeting, gather documents, submit by 2:00 p.m." },
        ].map((f) => (
          <div key={f.t} className="card p-5">
            <h3 className="font-semibold text-ink">{f.t}</h3>
            <p className="text-sm text-muted mt-1">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
