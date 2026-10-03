import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ProfileProvider } from "@/state/profile";
import { NavLinks } from "@/components/NavLinks";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BidPath · Alameda County contracts in plain English",
  description:
    "Find the County and local-agency contracts that fit your small business, see exactly why, what you need to qualify, and what to do next.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ProfileProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-paper focus:px-3 focus:py-2 focus:rounded-md"
          >
            Skip to content
          </a>
          <header className="border-b border-line bg-paper/80 backdrop-blur sticky top-0 z-40">
            <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
                <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-green text-white text-sm">
                  ✓
                </span>
                BidPath
                <span className="hidden sm:inline text-muted font-normal text-sm">· Alameda County</span>
              </Link>
              <NavLinks />
            </div>
          </header>
          <main id="main" className="flex-1">
            {children}
          </main>
          <footer className="border-t border-line mt-16">
            <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted space-y-2">
              <p>
                <strong className="text-ink">How to read this.</strong> BidPath compares what a solicitation says with what you told us.
                It never decides eligibility; only the agency does, after reading your full response. Figures marked as agency
                estimates come from the solicitation text; everything else links back to its source so you can check it.
              </p>
              <p>
                Records marked <em>sample</em> were written for this demo in the County&apos;s format and are not live postings.
                Records marked <em>from the portal</em> were entered by hand from documents downloaded on Oct 3, 2026 and may have
                changed since. Hackathon prototype for the OTW 10X Housing, Homelessness and Jobs challenge.
              </p>
            </div>
          </footer>
        </ProfileProvider>
      </body>
    </html>
  );
}
