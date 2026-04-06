import type { Metadata } from "next";
import "./globals.css";
import { BrandProvider } from "@/components/BrandProvider";
import { TranslationProvider } from "@/lib/i18n";
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
        <link
          href="https://fonts.googleapis.com/css2?family=Asap:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-brand-background text-brand-text font-body antialiased">
        <BrandProvider>
          <TranslationProvider>
            <AuthLoader>
              <SiteHeader />
              <main>{children}</main>
              <Footer />
              <BetSlip />
            </AuthLoader>
          </TranslationProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
