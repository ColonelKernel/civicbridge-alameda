import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ProfileProvider } from "@/state/profile";
import { LanguageProvider } from "@/state/language";
import { NavLinks } from "@/components/NavLinks";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { Wordmark } from "@/components/brand/Logo";
import { BRAND } from "@/lib/data/brand";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz", "SOFT"] });

export const metadata: Metadata = {
  title: `${BRAND.product} · ${BRAND.tagline}`,
  description: BRAND.short,
  applicationName: BRAND.product,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <ProfileProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-paper focus:px-3 focus:py-2 focus:rounded-md"
            >
              Skip to content
            </a>
            <header className="border-b border-line bg-paper/85 backdrop-blur sticky top-0 z-40 no-print">
              <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
                <Link href="/" className="shrink-0" aria-label={`${BRAND.product} home`}>
                  <Wordmark />
                </Link>
                <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
                  <NavLinks />
                  <LanguageToggle className="hidden md:inline-flex" />
                </div>
              </div>
            </header>
            <main id="main" className="flex-1">
              {children}
            </main>
            <div className="md:hidden mx-auto max-w-6xl px-4 pt-6 no-print">
              <LanguageToggle />
            </div>
            <SiteFooter />
          </ProfileProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
