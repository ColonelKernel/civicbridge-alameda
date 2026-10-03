#!/usr/bin/env node
/**
 * Pull the solicitation documents for every portal-sourced record into the
 * portal: public/docs/<solicitation-id>/<file>, plus a link to the agency's
 * bidding-portal project page when the County page gives one.
 *
 * Source: the County GSA "contracting opportunities" listing links each bid
 * to a bid page; legacy bids list their PDFs on alamedacountyca.gov, newer
 * ones point at the OpenGov portal (documents there need the portal itself).
 *
 * Usage: node scripts/fetch-attachments.mjs [--max-mb 30] [--dry]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LISTING = "https://gsa.acgov.org/do-business-with-us/contracting-opportunities/";
const BID = "https://gsa.acgov.org/do-business-with-us/contracting-opportunities/current-bid/?bidid=";
const UA = "ProcureFit/1.0 (hackathon prototype; fetching public solicitation documents)";
const args = process.argv.slice(2);
const MAX_MB = Number(args[args.indexOf("--max-mb") + 1] || 30);
const DRY = args.includes("--dry");

const idNumberPairs = [];
for (const file of ["src/lib/data/solicitations.real.ts", "src/lib/data/solicitations.listing.ts"]) {
  const src = readFileSync(join(ROOT, file), "utf8");
  for (const m of src.matchAll(/\n\s+id: "([^"]+)",\s*\n(?:.*\n){0,6}?\s+number: "([^"]+)",/g)) {
    if (!/^(d\d|bidder|debarment|sleb|min-quals|references|exceptions|bid-form)/.test(m[1])) idNumberPairs.push({ id: m[1], number: m[2] });
  }
}
const keyOf = (n) => {
  const m = n.match(/(\d{2}-\d{2}|\d{5,7})/);
  return m ? m[1] : null;
};

async function get(url) {
  const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}
const unesc = (s) => s.replace(/&amp;/g, "&").replace(/&#038;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const listing = await (await get(LISTING)).text();
const bidByKey = new Map();
for (const m of listing.matchAll(/href="(\/do-business-with-us\/contracting-opportunities\/current-bid\/\?bidid=(\d+))"[^>]*>([^<]*)</g)) {
  const k = keyOf(unesc(m[3]));
  if (k && !bidByKey.has(k)) bidByKey.set(k, m[2]);
}

const out = { fetchedAt: new Date().toISOString().slice(0, 10), records: {} };
let files = 0;
let bytesTotal = 0;
for (const { id, number } of idNumberPairs) {
  const k = keyOf(number);
  const bidid = k ? bidByKey.get(k) : undefined;
  if (!bidid) {
    console.log(`${id.padEnd(24)} ${number.padEnd(28)} not on the County GSA listing`);
    continue;
  }
  const page = await (await get(BID + bidid)).text();
  const portal = page.match(/href="(https:\/\/procurement\.opengov\.com\/portal\/acgov\/projects\/\d+)"/)?.[1];
  const docs = [];
  for (const m of page.matchAll(/href="(https?:\/\/(?:www\.)?(?:alamedacountyca|acgov)\.gov\/[^"]+\.(?:pdf|docx?|xlsx?|pptx?|zip))"[^>]*>([^<]*)</gi)) {
    const url = unesc(m[1]);
    if (docs.some((d) => d.url === url)) continue;
    docs.push({ url, label: unesc(m[2]).trim() || decodeURIComponent(url.split("/").pop()) });
  }
  const rec = { bidPageUrl: BID + bidid, portalUrl: portal, attachments: [] };
  for (const d of docs) {
    const name = decodeURIComponent(d.url.split("/").pop()).replace(/[^\w.\-()% ]+/g, "_");
    const rel = `docs/${id}/${name}`;
    const abs = join(ROOT, "public", rel);
    let bytes;
    let contentType;
    try {
      const head = await fetch(d.url, { method: "HEAD", headers: { "user-agent": UA } });
      bytes = Number(head.headers.get("content-length")) || undefined;
      contentType = head.headers.get("content-type") || undefined;
    } catch {
      /* fall through: still link remotely */
    }
    const tooBig = bytes && bytes > MAX_MB * 1024 * 1024;
    if (!DRY && !tooBig) {
      if (!existsSync(abs)) {
        mkdirSync(dirname(abs), { recursive: true });
        const res = await get(d.url);
        writeFileSync(abs, Buffer.from(await res.arrayBuffer()));
      }
      bytes = statSync(abs).size;
      files += 1;
      bytesTotal += bytes;
    }
    rec.attachments.push({ label: d.label, url: d.url, localPath: !DRY && !tooBig ? `/${rel}` : undefined, bytes, contentType });
  }
  out.records[id] = rec;
  console.log(`${id.padEnd(24)} ${number.padEnd(28)} bid ${bidid}: ${docs.length} file(s)${portal ? ", OpenGov project" : ""}`);
}
if (!DRY) writeFileSync(join(ROOT, "src/lib/data/attachments.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`\n${files} file(s), ${(bytesTotal / 1_048_576).toFixed(1)} MB copied into public/docs; cap ${MAX_MB} MB per file.`);
