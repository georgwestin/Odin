"use client";

export function ResponsibleGambling() {
  return (
    <section className="bg-brand-surface-alt border-t border-brand-border">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Badges row */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
          {/* 18+ badge */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-brand-text-muted text-brand-text-muted font-bold text-lg">
            18+
          </div>
          {/* Spelinspektionen placeholder */}
          <div className="flex items-center justify-center px-4 py-2 border border-brand-border rounded-xl bg-white">
            <span className="text-xs font-semibold text-brand-text-muted tracking-wide uppercase">
              Spelinspektionen
            </span>
          </div>
          {/* Stodlinjen */}
          <a
            href="https://www.stodlinjen.se"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 border border-brand-border rounded-xl bg-white hover:shadow-card transition-shadow"
          >
            <span className="text-xs font-semibold text-brand-primary">
              stodlinjen.se
            </span>
          </a>
          {/* Spelpaus */}
          <a
            href="https://www.spelpaus.se"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 border border-brand-border rounded-xl bg-white hover:shadow-card transition-shadow"
          >
            <span className="text-xs font-semibold text-brand-primary">
              spelpaus.se
            </span>
          </a>
        </div>

        {/* Info text */}
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="font-heading text-lg font-bold text-brand-text mb-3">
            Spela ansvarsfullt
          </h3>
          <p className="text-sm text-brand-text-muted leading-relaxed mb-4">
            Swedbet innehar svensk spellicens och foljer Spelinspektionens
            regler. Spel kan vara beroendeframkallande. Satt granser for din
            spelaktivitet och spela bara for pengar du har rad att forlora. Om du
            behover hjalp, kontakta Stodlinjen pa 020-819 100 eller besok{" "}
            <a
              href="https://www.stodlinjen.se"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              stodlinjen.se
            </a>
            . Du kan nar som helst stanga av dig fran allt licensierat spel via{" "}
            <a
              href="https://www.spelpaus.se"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              spelpaus.se
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
