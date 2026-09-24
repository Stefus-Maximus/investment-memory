import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { ToastHost } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Used only for the free-text content on "Mijn lessen" — the one place the
// app deliberately reads as a personal, editorial diary rather than
// interface text (§4.4 in CLAUDE.md).
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Investment Memory",
  description: "Remember what you thought.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // snap-y/snap-proximity live on the root scroller (this is a plain window-
  // scrolled app, no overflow wrapper) so "Mijn momenten" can opt individual
  // cards into snapping with scroll-snap-align — harmless everywhere else,
  // since only those cards ever set that property. --moment-scroll-anchor is
  // kept in sync with MomentsSection's own anchor line (§40) so the native
  // snap settles a card exactly where the chart/timeline sync already looks
  // for it, instead of fighting it.
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased snap-y snap-proximity scroll-pt-[var(--moment-scroll-anchor,0px)]`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
