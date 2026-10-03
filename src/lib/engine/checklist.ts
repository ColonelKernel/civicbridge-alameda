/**
 * Turn a solicitation (plus the owner's gap analysis) into a dated checklist.
 * Every item says where it came from:
 *   solicitation     - a document or event the solicitation itself requires
 *   standard         - a general County step (vendor registration, addenda)
 *   glossary-advice  - something the gap analysis suggests investigating
 * Dates are derived with business-day math and clamped to "Do now" when the
 * computed date has already passed.
 */
import type { Evidence, MatchResult, Solicitation, SourceRef } from "@/lib/data/types";
import { GLOSSARY, glossaryFor } from "@/lib/data/glossary";
import { CERT_BY_CODE, certLabel } from "@/lib/data/certifications";
import { PROGRAM_BY_ID } from "@/lib/data/programs";
import { agencyFor } from "@/lib/data/agencies";
import { participationShares } from "@/lib/data/mechanisms";
import { daysBetween, formatCivic, formatDate, subtractBusinessDays, type ISODate } from "./dates";

export type ItemOrigin = "solicitation" | "standard" | "glossary-advice";

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
  origin: ItemOrigin;
  sourceRef: SourceRef;
  mandatory?: boolean;
  warning?: string;
  glossaryKey?: string;
  link?: string;
}

export interface ChecklistGroup {
  id: string;
  label: string;
  date: ISODate | null;
  kind: "do-now" | "before" | "on" | "closed";
  items: ChecklistItem[];
  notes: string[];
}

export interface Checklist {
  groups: ChecklistGroup[];
  dueDate: ISODate;
  closed: boolean;
  /** Stable key for persisting ticks; changes when the dates change. */
  storageKey: string;
}

function hashDates(sol: Solicitation): string {
  const s = JSON.stringify(sol.dates);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

const money = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M` : `$${Math.round(n / 1000).toLocaleString()}k`);

export function buildChecklist(sol: Solicitation, today: ISODate, match?: MatchResult): Checklist {
  const due = sol.dates.submissionDue;
  const closed = sol.status !== "open" || due.date < today;
  const groups: ChecklistGroup[] = [];
  const d = sol.dates;
  const r = sol.requirements;

  // ---- Prep group (licenses, registration, credentials to investigate)
  const prepItems: ChecklistItem[] = [];
  for (const l of r.licenses) {
    prepItems.push({ id: `confirm-license-${l.code}`, label: `Confirm your ${l.label} is active and note the number for the bid forms`, origin: "solicitation", sourceRef: { field: "requirements.licenses", quote: l.quote }, glossaryKey: glossaryFor(`license:${l.code}`)?.key });
  }
  const agency = agencyFor(sol.agencyId);
  const share = participationShares(sol)[0];
  if (agency.countyGoverned) prepItems.push({ id: "vendor-registration", label: "Register on the County of Alameda Procurement Portal (free) and follow this project", detail: "Needed to download documents, ask questions and upload your response.", origin: "standard", sourceRef: { field: "standard" }, glossaryKey: "registration:COUNTY_VENDOR", link: GLOSSARY["registration:COUNTY_VENDOR"].link });
  else prepItems.push({ id: "vendor-registration", label: `Register on ${agency.displayName}'s bid portal, if you have not already, and follow this posting`, detail: "The posting says where to download documents, ask questions and submit. Registration is usually free; do it early in case approval takes a day.", origin: "standard", sourceRef: { field: "standard" }, link: agency.procurementUrl ?? undefined });
  if (r.dirRegistration) prepItems.push({ id: "dir-registration", label: "Confirm or obtain DIR public works registration", origin: "solicitation", sourceRef: { field: "requirements.dirRegistration" }, glossaryKey: "registration:DIR", link: GLOSSARY["registration:DIR"].link });
  for (const b of r.bonding) {
    prepItems.push({ id: `bond-${b.type}`, label: `Call a surety broker about the ${b.type} bond${b.percent ? ` (${b.percent}%)` : ""}`, origin: "solicitation", sourceRef: { field: "requirements.bonding", quote: b.quote }, glossaryKey: `bonding:${b.type.toUpperCase()}` });
  }
  if (match) {
    const daysLeft = daysBetween(today, due.date);
    for (const e of match.evidence) {
      if ((e.status !== "missing" && e.status !== "check") || !e.requirementKey) continue;
      if (!["certRequired", "certPreferred", "license", "experience"].includes(e.ruleId)) continue;
      if (e.ruleId === "license" && e.status === "missing") {
        // license already covered above as "confirm"; replace with investigate wording
      }
      const g = glossaryFor(e.glossaryKey ?? e.requirementKey);
      const notAchievable = g?.leadTimeDays !== undefined && g.leadTimeDays > daysLeft;
      prepItems.push({
        id: `investigate-${e.requirementKey}`,
        label: e.status === "missing" ? `Look into: ${g?.term ?? e.label}` : `Verify: ${g?.term ?? e.label}`,
        detail: e.action ?? g?.action,
        origin: "glossary-advice",
        sourceRef: e.sourceRef,
        glossaryKey: g?.key,
        link: g?.link,
        warning: notAchievable
          ? `Usually takes ${g?.leadTime}; likely not achievable before this deadline. ${e.ruleId === "certPreferred" ? "Not required to bid." : "Ask the contact about alternatives."}`
          : undefined,
      });
    }
  }
  if (match) {
    for (const e of match.evidence) {
      if (e.ruleId !== "participationGoal" || e.status !== "check") continue;
      const code = (e.requirementKey ?? "goal:").slice(5);
      const req = r.certifications.find((c) => c.code.toUpperCase() === code);
      const pct = req?.mechanism === "participation-goal" ? (req.goalPercent ?? req.percent) : req?.goalPercent;
      const program = CERT_BY_CODE[code]?.programId ? PROGRAM_BY_ID[CERT_BY_CODE[code].programId!] : undefined;
      const v = sol.estimatedValue;
      const share = pct && v ? ` (about ${money(Math.round((v.min * pct) / 100))}${v.min !== v.max ? `–${money(Math.round((v.max * pct) / 100))}` : ""} of the agency's estimate)` : "";
      prepItems.push({
        id: `teaming-${code}`,
        label: `Line up certified ${certLabel(code)} subcontractors for the ${pct ? `${pct}% ` : ""}participation share${share}${req?.exceptionAllowed ? ", or prepare the written exception" : ""}`,
        detail: e.detail,
        origin: "solicitation",
        sourceRef: e.sourceRef,
        glossaryKey: e.glossaryKey,
        link: program?.directoryUrl ?? program?.officialUrl,
      });
    }
  }
  const meetings = [d.preBidMeeting, d.siteVisit].filter(Boolean) as NonNullable<typeof d.preBidMeeting>[];
  const firstMeeting = meetings.map((m) => m.when.date).sort()[0];
  const prepDate = firstMeeting ? subtractBusinessDays(firstMeeting, 2) : subtractBusinessDays(due.date, 10);
  groups.push({ id: "prep", label: "Get ready", date: prepDate, kind: "before", items: prepItems, notes: [] });

  // ---- Meeting prerequisite groups and meeting groups
  for (const m of meetings) {
    const kind = m === d.preBidMeeting ? "pre-bid meeting" : "site visit";
    const field = m === d.preBidMeeting ? "dates.preBidMeeting" : "dates.siteVisit";
    if (m.prerequisite) {
      groups.push({
        id: `prereq-${field}`,
        label: "Clearance form",
        date: m.prerequisite.due.date,
        kind: "before",
        items: [{ id: `prereq-${field}`, label: m.prerequisite.label, detail: `Due ${formatCivic(m.prerequisite.due)}. Required to attend the ${m.mandatory ? "mandatory " : ""}${kind}.`, origin: "solicitation", sourceRef: { field: `${field}.prerequisite`, quote: m.prerequisite.quote }, mandatory: m.mandatory, glossaryKey: "meeting:PREREQUISITE" }],
        notes: [],
      });
    }
    groups.push({
      id: `meeting-${field}`,
      label: m.mandatory ? `Mandatory ${kind}` : `Optional ${kind}`,
      date: m.when.date,
      kind: "on",
      items: [{ id: `attend-${field}`, label: `${m.mandatory ? "Attend (required)" : "Attend if you can"}: ${kind} at ${formatCivic(m.when)}`, detail: `${m.location}${m.mandatory ? ". Sign the attendance list; bids from companies not on it are rejected." : `. Good place to meet primes${share ? ` looking for ${certLabel(share.code)} subcontractors` : " and partners"}.`}`, origin: "solicitation", sourceRef: { field, quote: m.quote }, mandatory: m.mandatory, glossaryKey: "meeting:PREBID" }],
      notes: [],
    });
  }

  // ---- Questions
  if (d.questionsDue) {
    const past = d.questionsDue.date < today;
    groups.push({
      id: "questions",
      label: "Questions",
      date: d.questionsDue.date,
      kind: "before",
      items: [
        past
          ? { id: "read-qa", label: "Questions deadline passed: read the posted Q&A and any addenda on the project page", origin: "standard", sourceRef: { field: "dates.questionsDue" }, glossaryKey: "doc:ADDENDA" }
          : { id: "submit-questions", label: `Submit written questions through the portal's Q&A tab by ${formatCivic(d.questionsDue)}`, detail: "Ask about anything unclear in the scope, pricing form or requirements. Answers are posted for everyone.", origin: "solicitation", sourceRef: { field: "dates.questionsDue" } },
      ],
      notes: d.preBidMeeting && d.questionsDue.date < d.preBidMeeting.when.date ? ["Note: questions are due before the bidders conference, so read the packet first."] : [],
    });
  }

  // ---- Documents
  const docItems: ChecklistItem[] = sol.documents.map((doc) => ({
    id: `doc-${doc.id}`,
    label: doc.label,
    detail: doc.note,
    origin: "solicitation",
    sourceRef: { field: "documents", quote: doc.quote },
    glossaryKey: doc.id === "bid-form" ? "doc:BID_FORM_EXCEL" : doc.id === "debarment" ? "doc:DEBARMENT" : doc.id === "exceptions" ? "doc:EXCEPTIONS" : doc.id === "sleb-sheet" ? "cert:SLEB" : undefined,
  }));
  if (sol.listingOnly) docItems.push({ id: "read-posting", label: "Open the posting and list every required document", origin: "standard", sourceRef: { field: "sourceUrl", url: sol.sourceUrl } });
  docItems.push({ id: "check-addenda", label: "Check the project page for addenda and use the newest version of every form", origin: "standard", sourceRef: { field: "standard" }, glossaryKey: "doc:ADDENDA" });
  if (r.insurance.length) docItems.push({ id: "insurance-broker", label: `Send the insurance requirements to your broker and ask for a sample certificate with ${agency.countyGoverned ? "County" : agency.displayName} endorsements`, detail: "Certificates are due before award, not with the bid, but a quote now avoids surprises.", origin: "solicitation", sourceRef: { field: "requirements.insurance" }, glossaryKey: "insurance:general-liability" });
  groups.push({ id: "documents", label: "Prepare your response", date: subtractBusinessDays(due.date, 3), kind: "before", items: docItems, notes: [] });

  // ---- Submit
  groups.push({
    id: "submit",
    label: "Submit",
    date: due.date,
    kind: "on",
    items: [{ id: "submit", label: `Submit by ${formatCivic(due)}`, detail: sol.submissionMethod + (due.time ? " Late responses are not accepted; upload the day before if you can." : ""), origin: "solicitation", sourceRef: { field: "submissionMethod" }, mandatory: true, glossaryKey: "term:PORTAL_SUBMISSION" }],
    notes: [],
  });

  // ---- Sort by date, drop past optional meetings, clamp past prep dates into "Do now".
  const sorted = groups
    .filter((g) => !(g.kind === "on" && g.id.startsWith("meeting-") && g.date && g.date < today && !g.items[0].mandatory))
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  const doNow: ChecklistGroup = { id: "do-now", label: "Do now", date: today, kind: "do-now", items: [], notes: [] };
  const final: ChecklistGroup[] = [];
  for (const g of sorted) {
    if (closed) {
      final.push({ ...g, kind: "closed" });
      continue;
    }
    if (g.kind === "before" && g.date && g.date <= today && g.id !== "questions") {
      doNow.items.push(...g.items);
      doNow.notes.push(...g.notes);
      continue;
    }
    if (g.kind === "on" && g.date && g.date < today && g.items[0].mandatory) {
      // Past mandatory meeting: keep as a warning line in Do now.
      doNow.items.push({ ...g.items[0], label: `${g.label} was ${formatDate(g.date)}: confirm you were on the attendance list`, warning: "If you did not attend, you cannot bid on this one." });
      continue;
    }
    final.push(g);
  }
  if (doNow.items.length) final.unshift(doNow);

  // Merge groups sharing a date (except Do now).
  const merged: ChecklistGroup[] = [];
  for (const g of final) {
    const prev = merged[merged.length - 1];
    if (prev && prev.kind !== "do-now" && g.kind !== "do-now" && prev.date === g.date && prev.kind === g.kind) {
      prev.items.push(...g.items);
      prev.notes.push(...g.notes);
      prev.label = `${prev.label} + ${g.label}`;
    } else {
      merged.push({ ...g, items: [...g.items], notes: [...g.notes] });
    }
  }

  return { groups: merged, dueDate: due.date, closed, storageKey: `ticks:${sol.id}:${hashDates(sol)}` };
}

export function groupHeading(g: ChecklistGroup): string {
  if (g.kind === "do-now") return "Do now";
  if (!g.date) return g.label;
  if (g.kind === "before") return `Before ${formatDate(g.date)}`;
  return formatDate(g.date);
}

export function describeEvidenceForChecklist(e: Evidence): string {
  return `${e.label}: ${e.detail}`;
}
