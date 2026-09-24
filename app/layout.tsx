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
  // The root scroller deliberately carries no scroll-snap of its own. This is
  // a plain window-scrolled app, so any snapping set here would apply to every
  // page and to the whole length of each one; "Mijn momenten" is the only
  // place that wants it, and MomentsSection switches it on and off for
  // exactly the stretch of the company page where it belongs.
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
