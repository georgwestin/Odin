"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  FAQ data                                                           */
/* ------------------------------------------------------------------ */

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_LEFT: FaqItem[] = [
  {
    id: "faq-1",
    question: "Hur skapar jag ett konto?",
    answer:
      "Klicka p\u00e5 \"Registrera\" i menyn och fyll i dina uppgifter. Verifiering sker via BankID f\u00f6r svenska spelare. Du kan b\u00f6rja spela direkt efter verifiering.",
  },
  {
    id: "faq-2",
    question: "\u00c4r spelen r\u00e4ttvisa?",
    answer:
      "Alla v\u00e5ra spel anv\u00e4nder certifierad RNG-teknik (Random Number Generator) och granskas regelbundet av oberoende tredjepartslaboratorier f\u00f6r att s\u00e4kerst\u00e4lla r\u00e4ttvisa.",
  },
  {
    id: "faq-3",
    question: "Vad \u00e4r RTP?",
    answer:
      "Return to Player (RTP) visar den procentandel av insatta pengar som \u00e5terbetalas till spelare \u00f6ver tid. Exempelvis inneb\u00e4r ett RTP p\u00e5 96% att 96 kr av 100 kr \u00e5terbetalas i genomsnitt.",
  },
  {
    id: "faq-4",
    question: "Hur g\u00f6r jag en ins\u00e4ttning?",
    answer:
      "Vi accepterar Trustly, bankkort (Visa/Mastercard), Swish och flera andra betalningsmetoder. Ins\u00e4ttningar krediteras omedelbart p\u00e5 ditt spelkonto.",
  },
  {
    id: "faq-5",
    question: "Hur fungerar uttag?",
    answer:
      "Vinster bearbetas normalt inom 24 timmar till din ursprungliga betalningsmetod. F\u00f6r Trustly-uttag \u00e4r pengarna ofta p\u00e5 ditt bankkonto inom minuter.",
  },
];

const FAQ_RIGHT: FaqItem[] = [
  {
    id: "faq-6",
    question: "Kan jag spela p\u00e5 mobilen?",
    answer:
      "Ja, alla v\u00e5ra spel fungerar perfekt p\u00e5 telefoner och surfplattor. Gr\u00e4nssnittet anpassar sig automatiskt till din sk\u00e4rmstorlek.",
  },
  {
    id: "faq-7",
    question: "\u00c4r mina pengar s\u00e4kra?",
    answer:
      "Vi anv\u00e4nder bankniv\u00e5kryptering (SSL/TLS) och h\u00e5ller alla spelarmedel p\u00e5 separata konton. Vi \u00e4r licensierade och reglerade enligt svenska spellagen.",
  },
  {
    id: "faq-8",
    question: "Vad \u00e4r spelgr\u00e4nser?",
    answer:
      "Du kan s\u00e4tta dagliga, veckovisa och m\u00e5natliga ins\u00e4ttningsgr\u00e4nser under ditt konto. \u00c4ndringar uppg\u00e5r omedelbart vid s\u00e4nkning men har 72 timmars v\u00e4ntetid vid h\u00f6jning.",
  },
  {
    id: "faq-9",
    question: "Hur kontaktar jag kundtj\u00e4nst?",
    answer:
      "V\u00e5rt supportteam \u00e4r tillg\u00e4ngligt dygnet runt via livechatt, e-post (support@swedbet.se) och telefon. Genomsnittlig svarstid via chatt \u00e4r under 2 minuter.",
  },
  {
    id: "faq-10",
    question: "Vad g\u00f6r jag om jag beh\u00f6ver hj\u00e4lp med spelberoende?",
    answer:
      "Vi tar ansvarsfullt spelande p\u00e5 st\u00f6rsta allvar. Du kan n\u00e4r som helst st\u00e4nga ditt konto, och vi h\u00e4nvisar till St\u00f6dlinjen (020-819 100) f\u00f6r professionell hj\u00e4lp.",
  },
];

/* ------------------------------------------------------------------ */
/*  Accordion Item component                                           */
/* ------------------------------------------------------------------ */

function AccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-brand-text md:py-5 md:text-base hover:text-brand-primary transition-colors"
      >
        <span>{item.question}</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 ml-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="pb-5 text-sm text-brand-text-muted leading-relaxed md:pb-6">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function SupportPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-white font-body">
      {/* ===================== HEADER (Relume Faq10 style) ===================== */}
      <section className="px-[5%] py-16 md:py-24 lg:py-28">
        <div className="container mx-auto">
          {/* Centered title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-12 w-full max-w-lg text-center md:mb-16 lg:mb-20"
          >
            <h1 className="mb-5 text-4xl font-bold text-brand-text md:mb-6 md:text-6xl lg:text-7xl">
              Support &amp; Hj&auml;lp
            </h1>
            <p className="text-brand-text-muted md:text-lg">
              Hitta svar p&aring; de vanligaste fr&aring;gorna om v&aring;r plattform, spel och konto.
            </p>
          </motion.div>

          {/* Two-column FAQ grid (Relume Faq10 style) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="grid w-full auto-rows-min grid-cols-1 items-start gap-x-12 md:grid-cols-2 lg:gap-x-16"
          >
            {/* Left column */}
            <div className="w-full">
              {FAQ_LEFT.map((item) => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isOpen={openItems.has(item.id)}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </div>

            {/* Right column */}
            <div className="w-full border-t border-gray-200 md:border-t-0">
              {FAQ_RIGHT.map((item) => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isOpen={openItems.has(item.id)}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </div>
          </motion.div>

          {/* Still have questions? -- Relume Faq10 footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto mt-12 max-w-md text-center md:mt-16 lg:mt-20"
          >
            <h4 className="mb-3 text-xl font-bold text-brand-text md:mb-4 md:text-2xl lg:text-3xl">
              Har du fortfarande fr&aring;gor?
            </h4>
            <p className="text-brand-text-muted md:text-lg">
              Kontakta v&aring;rt supportteam n&auml;r som helst.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:mt-8">
              <a
                href="mailto:support@swedbet.se"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-brand-primary text-white font-bold text-sm hover:bg-brand-primary/90 transition-colors"
              >
                Kontakta oss
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-7 py-3 rounded-full border border-brand-border text-brand-text font-semibold text-sm hover:bg-brand-surface-alt transition-colors"
              >
                Tillbaka till startsidan
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===================== CONTACT INFO SECTION ===================== */}
      <section className="px-[5%] py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
            {/* Live Chat */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-primary">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <h3 className="mb-2 font-bold text-brand-text text-lg">Livechatt</h3>
              <p className="text-sm text-brand-text-muted">
                Tillg&auml;nglig dygnet runt. Genomsnittlig v&auml;ntetid under 2 minuter.
              </p>
            </div>

            {/* Email */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-primary">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h3 className="mb-2 font-bold text-brand-text text-lg">E-post</h3>
              <p className="text-sm text-brand-text-muted">
                support@swedbet.se &mdash; Vi svarar inom 24 timmar.
              </p>
            </div>

            {/* Phone */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-primary">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <h3 className="mb-2 font-bold text-brand-text text-lg">Telefon</h3>
              <p className="text-sm text-brand-text-muted">
                08-123 456 78 &mdash; M&aring;n-fre 09:00-21:00, Helger 10:00-18:00.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
