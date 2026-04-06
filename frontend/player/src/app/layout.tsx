import type { Metadata } from "next";
import "./globals.css";
import { BrandProvider } from "@/components/BrandProvider";
import { AuthLoader } from "@/components/AuthLoader";
import { Navbar } from "@/components/Navbar";
import { BetSlip } from "@/components/BetSlip";

export const metadata: Metadata = {
  title: "Odin - Play Your Way",
  description: "Casino, sports betting, and live gaming platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-brand-background text-brand-text font-body antialiased">
        <BrandProvider>
          <AuthLoader>
            <Navbar />
            <main className="pt-16">{children}</main>
            <BetSlip />
          </AuthLoader>
        </BrandProvider>
      </body>
    </html>
  );
}
