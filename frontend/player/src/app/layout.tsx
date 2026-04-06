import type { Metadata } from "next";
import "./globals.css";
import { BrandProvider } from "@/components/BrandProvider";
import { AuthLoader } from "@/components/AuthLoader";
import { Navbar } from "@/components/Navbar";
import { BetSlip } from "@/components/BetSlip";

export const metadata: Metadata = {
  title: "Swedbet - Det smarta spelbolaget",
  description:
    "Casino, sportsbetting och live casino. Svenskt spelbolag med snabba uttag. Spela ansvarsfullt. 18+",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-brand-background text-brand-text font-body antialiased">
        <BrandProvider>
          <AuthLoader>
            {/* Responsible gambling top bar */}
            <div className="bg-brand-secondary text-white/70 text-xs text-center py-1.5 px-4">
              <span>
                Spela ansvarsfullt | 18+ |{" "}
                <a
                  href="https://www.stodlinjen.se"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white"
                >
                  stodlinjen.se
                </a>{" "}
                |{" "}
                <a
                  href="https://www.spelpaus.se"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white"
                >
                  spelpaus.se
                </a>
              </span>
            </div>
            <Navbar />
            <main className="pt-16">{children}</main>
            <BetSlip />
          </AuthLoader>
        </BrandProvider>
      </body>
    </html>
  );
}
