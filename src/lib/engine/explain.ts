/**
 * The "procurement translator": a deterministic plain-language summary built
 * only from the solicitation's structured fields. Every line carries a source
 * reference so the UI can show where it came from. No LLM is involved, so
 * nothing here can invent a requirement.
 */
import { INSURANCE_LABELS, type MatchResult, type Solicitation, type SourceRef } from "@/lib/data/types";
import { daysBetween, formatCivic, formatDate, type ISODate } from "./dates";
import { certLabel } from "@/lib/data/certifications";
import { agencyFor } from "@/lib/data/agencies";

export type SectionKey = "need" | "money" | "who" | "submit" | "dates" | "watch";

export interface SummaryLine {
  text: string;
  sourceRef?: SourceRef;
  tone?: "warn" | "info" | "good";
}

export interface SummarySection {
  key: SectionKey;
  title: string;
  lines: SummaryLine[];
}

const money = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : `$${Math.round(n / 1000).toLocaleString()}k`;

export function buildSummary(sol: Solicitation, today: ISODate, match?: MatchResult): SummarySection[] {
  const sections: SummarySection[] = [];

  // WHAT THEY NEED
  sections.push({
    key: "need",
    title: "What they need",
    lines: [
      { text: sol.summary, sourceRef: { field: "summary" } },
      { text: `Posted by ${sol.department}.`, sourceRef: { field: "department" } },
      ...(sol.term ? [{ text: `Term: ${sol.term}.`, sourceRef: { field: "term" } }] : []),
      ...(sol.listingOnly
        ? [{ text: "Only the public listing has been captured; open the posting for the full scope.", tone: "warn" as const, sourceRef: { field: "sourceUrl", url: sol.sourceUrl } }]
        : []),
    ],
  });

  // HOW MUCH
  const v = sol.estimatedValue;
  const moneyLines: SummaryLine[] = [];
  if (!v) {
    moneyLines.push({ text: "The solicitation does not state an estimated value. We did not guess; your quote sets the price.", sourceRef: { field: "estimatedValue" } });
  } else {
    const range = v.min === v.max ? money(v.min) : `${money(v.min)} to ${money(v.max)}`;
    const basis =
      v.basis === "annual" ? "per year" : v.basis === "per-order" ? "per order" : v.basis === "nte-pool" ? `as a shared not-to-exceed pool${v.termYears ? ` over ${v.termYears} years` : ""}` : "total";
    moneyLines.push({ text: `Agency estimate: ${range} ${basis}.`, sourceRef: { field: "estimatedValue", quote: v.quote } });
    if (v.basis === "nte-pool") moneyLines.push({ text: "A pool is shared by every awarded vendor and split into task orders; individual jobs are usually much smaller.", tone: "info" });
  }
  sections.push({ key: "money", title: "How much", lines: moneyLines });

  // WHO CAN BID
  const who: SummaryLine[] = [];
  const r = sol.requirements;
  for (const l of r.licenses) who.push({ text: `Licensed: ${l.label}.`, sourceRef: { field: "requirements.licenses", quote: l.quote } });
  for (const c of r.certifications.filter((c) => c.required)) who.push({ text: `Certified: ${c.label}.`, sourceRef: { field: "requirements.certifications", quote: c.quote } });
  if (r.experience) {
    const desc = r.experience.description.trim().replace(/\.$/, "");
    const text = /^\d/.test(desc) ? `At least ${desc}.` : `At least ${r.experience.years} year${r.experience.years === 1 ? "" : "s"} ${desc}.`;
    who.push({ text, sourceRef: { field: "requirements.experience", quote: r.experience.quote } });
  }
  if (r.location.type === "county-required") who.push({ text: `Located in Alameda County${r.location.note ? ` (${r.location.note.toLowerCase()})` : ""}.`, sourceRef: { field: "requirements.location", quote: r.location.quote } });
  if (r.location.type === "radius") who.push({ text: `Within ${r.location.radiusMiles} miles${r.location.note ? ` (${r.location.note})` : ""}.`, sourceRef: { field: "requirements.location", quote: r.location.quote } });
  if (r.statedStaffingMin) who.push({ text: `At least ${r.statedStaffingMin.count} staff for this contract.`, sourceRef: { field: "requirements.statedStaffingMin", quote: r.statedStaffingMin.quote } });
  if (r.dirRegistration) who.push({ text: "Registered with the DIR as a public works contractor.", sourceRef: { field: "requirements.dirRegistration" } });
  for (const c of r.certifications.filter((c) => !c.required)) who.push({ text: `Preferred, not required: ${c.label}.`, tone: "info", sourceRef: { field: "requirements.certifications", quote: c.quote } });
  if (r.location.type === "local-preference") who.push({ text: "Anyone may bid; Alameda County businesses get a local preference.", tone: "info", sourceRef: { field: "requirements.location", quote: r.location.quote } });
  for (const o of r.other) who.push({ text: o.label + ".", sourceRef: { field: "requirements.other", quote: o.quote } });
  if (who.length === 0) who.push({ text: sol.listingOnly ? "Not captured yet; read the posting." : "The solicitation does not state specific licenses or certifications beyond normal business permits.", tone: "info" });
  sections.push({ key: "who", title: "Who can bid", lines: who });

  // WHAT YOU MUST SUBMIT
  const submit: SummaryLine[] = sol.documents.map((d) => ({ text: d.label + (d.note ? ` (${d.note})` : ""), sourceRef: { field: "documents", quote: d.quote } }));
  if (r.insurance.length) {
    submit.push({
      text: `Insurance (certificates due before award, not with the bid): ${r.insurance.map((i) => `${INSURANCE_LABELS[i.type]}${i.limit === "statutory" ? "" : ` $${(i.limit / 1_000_000).toFixed(i.limit % 1_000_000 === 0 ? 0 : 1)}M`}`).join("; ")}.`,
      sourceRef: { field: "requirements.insurance" },
      tone: "info",
    });
  }
  for (const b of r.bonding) submit.push({ text: `${b.type === "bid" ? "Bid bond" : b.type === "performance" ? "Performance bond" : "Payment bond"}${b.percent ? ` (${b.percent}%)` : ""}.`, sourceRef: { field: "requirements.bonding", quote: b.quote } });
  submit.push({ text: sol.submissionMethod, sourceRef: { field: "submissionMethod" }, tone: "info" });
  sections.push({ key: "submit", title: "What you must submit", lines: submit });

  // IMPORTANT DATES
  const dates: SummaryLine[] = [];
  const d = sol.dates;
  if (d.preBidMeeting) {
    const m = d.preBidMeeting;
    if (m.prerequisite) dates.push({ text: `${m.prerequisite.label}: due ${formatCivic(m.prerequisite.due, { year: true })}.`, tone: m.prerequisite.due.date < today ? "warn" : "info", sourceRef: { field: "dates.preBidMeeting.prerequisite", quote: m.prerequisite.quote } });
    dates.push({ text: `${m.mandatory ? "Mandatory" : "Optional"} pre-bid meeting: ${formatCivic(m.when, { year: true })}, ${m.location}.`, tone: m.mandatory ? "warn" : undefined, sourceRef: { field: "dates.preBidMeeting", quote: m.quote } });
  }
  if (d.siteVisit) {
    const m = d.siteVisit;
    if (m.prerequisite) dates.push({ text: `${m.prerequisite.label}: due ${formatCivic(m.prerequisite.due, { year: true })}.`, tone: "info", sourceRef: { field: "dates.siteVisit.prerequisite", quote: m.prerequisite.quote } });
    dates.push({ text: `${m.mandatory ? "Mandatory" : "Optional"} site visit: ${formatCivic(m.when, { year: true })}, ${m.location}.`, tone: m.mandatory ? "warn" : undefined, sourceRef: { field: "dates.siteVisit", quote: m.quote } });
  }
  if (d.questionsDue) dates.push({ text: `Written questions due: ${formatCivic(d.questionsDue, { year: true })}${d.questionsDue.date < today ? " (passed; read the posted answers)" : ""}.`, sourceRef: { field: "dates.questionsDue" } });
  dates.push({ text: `Response due: ${formatCivic(d.submissionDue, { year: true })}${d.submissionDue.time ? ". Late responses are not accepted." : ". Time not stated; confirm on the solicitation."}`, tone: "warn", sourceRef: { field: "dates.submissionDue" } });
  if (d.anticipatedAward) dates.push({ text: `Award consideration: ${formatDate(d.anticipatedAward, { year: true })}.`, sourceRef: { field: "dates.anticipatedAward" } });
  if (d.contractStart) dates.push({ text: `Contract start: ${formatDate(d.contractStart, { year: true })}.`, sourceRef: { field: "dates.contractStart" } });
  sections.push({ key: "dates", title: "Important dates", lines: dates });

  // WATCH OUT
  const watch: SummaryLine[] = [];
  const daysLeft = daysBetween(today, d.submissionDue.date);
  for (const m of [d.preBidMeeting, d.siteVisit]) {
    if (!m?.mandatory) continue;
    if (m.prerequisite && m.prerequisite.due.date < today && m.when.date >= today) watch.push({ text: `The clearance form needed to attend the mandatory meeting was due ${formatDate(m.prerequisite.due.date)}. Without it you cannot attend, which means you cannot bid unless the agency allows late forms.`, tone: "warn", sourceRef: { field: "dates.preBidMeeting.prerequisite", quote: m.prerequisite.quote } });
    else if (m.when.date < today) watch.push({ text: `The mandatory meeting was held ${formatDate(m.when.date)}. If you were not on the attendance list, you cannot submit.`, tone: "warn", sourceRef: { field: "dates.preBidMeeting", quote: m.quote } });
    else watch.push({ text: `Attendance at the ${formatDate(m.when.date)} meeting is mandatory. Bids from companies not on the attendance list are rejected.`, tone: "warn", sourceRef: { field: "dates.preBidMeeting", quote: m.quote } });
  }
  if (r.prevailingWage) watch.push({ text: "Public works rules: prevailing wage rates, certified payroll and DIR registration. Price your labor with DIR rates, not market rates.", tone: "warn", sourceRef: { field: "requirements.prevailingWage" } });
  if (r.livingWage) watch.push({ text: agencyFor(sol.agencyId).countyGoverned ? "The County living wage requirement applies to staff on this contract." : `${agencyFor(sol.agencyId).displayName}'s living wage ordinance applies to staff on this contract.`, tone: "warn", sourceRef: { field: "requirements.livingWage" } });
  if (r.bonding.length) watch.push({ text: "Bonds are required. If you have never been bonded, call a surety broker this week; first-time bonding takes weeks.", tone: "warn", sourceRef: { field: "requirements.bonding" } });
  if (daysLeft >= 0 && daysLeft <= 10) watch.push({ text: `Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} left. Upload a day early; the portal closes at the stated time and late uploads are refused.`, tone: "warn", sourceRef: { field: "dates.submissionDue" } });
  if (r.location.type === "county-required") watch.push({ text: "Bidders must be located in Alameda County.", tone: "warn", sourceRef: { field: "requirements.location", quote: r.location.quote } });
  if (d.questionsDue && d.preBidMeeting && d.questionsDue.date < d.preBidMeeting.when.date) watch.push({ text: "Questions are due before the bidders conference, so read the packet first.", tone: "info", sourceRef: { field: "dates.questionsDue" } });
  for (const c of r.certifications) {
    const mechanism = c.mechanism ?? (c.required ? "credential" : "preference");
    const ref = { field: "requirements.certifications", quote: c.quote };
    if (mechanism === "set-aside") watch.push({ text: c.scope === "partial" ? `A portion of this work is set aside for ${c.label}; only firms with that status may bid on that portion.` : `Set aside for ${c.label}: only firms with that status may bid on it.`, tone: "warn", sourceRef: ref });
    const goal = mechanism === "participation-goal" ? (c.goalPercent ?? c.percent) : c.goalPercent;
    if (goal) watch.push({ text: `${goal}% ${certLabel(c.code)} participation: bidders without the certification must subcontract that share to certified firms${c.exceptionAllowed ? " or take a written exception on the form" : ""}. A certified prime's own work usually counts.${c.exceptionAllowed ? "" : " The posting does not describe an exception; ask before assuming one."}`, tone: "info", sourceRef: ref });
    else if (mechanism === "preference" && c.percent) watch.push({ text: `${certLabel(c.code)} certification is worth a ${c.percent}% bid preference here. Not having it does not stop you from bidding.`, tone: "info", sourceRef: ref });
  }
  if (match) {
    for (const e of match.classification.blockers) {
      if (e.ruleId === "availability" || e.ruleId === "mandatoryMeeting") continue;
      watch.push({ text: `${e.label}. ${e.detail}`, tone: "warn", sourceRef: e.sourceRef });
    }
  }
  if (watch.length === 0) watch.push({ text: "No unusual traps found in the stated requirements. Read the full packet anyway; this summary only covers what was extracted.", tone: "good" });
  sections.push({ key: "watch", title: "Watch out", lines: watch });

  return sections;
}
