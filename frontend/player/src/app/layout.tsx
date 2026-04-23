import type { Metadata } from "next";
import "./globals.css";
import { BrandProvider } from "@/components/BrandProvider";
import { LocaleProvider } from "@/lib/locale-context";
import { AuthLoader } from "@/components/AuthLoader";
import { SiteHeader } from "@/components/SiteHeader";
import { BetSlip } from "@/components/BetSlip";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "SwedBet.com - Det smarta spelbolaget",
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
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="180x180" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Agdasima:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-brand-background text-brand-text font-body antialiased">
        <BrandProvider>
          <LocaleProvider>
            <AuthLoader>
              <SiteHeader />
              <main>{children}</main>
              <Footer />
              <BetSlip />
            </AuthLoader>
          </LocaleProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
