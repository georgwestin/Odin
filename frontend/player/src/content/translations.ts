export const translations: Record<string, Record<string, string>> = {
  sv: {
    // Nav
    "nav.sport": "SPORT",
    "nav.slots": "SLOTS",
    "nav.blackjack": "BLACKJACK",
    "nav.roulette": "ROULETTE",
    "nav.live": "LIVE",

    // Common
    "common.play": "Spela",
    "common.playNow": "Spela nu",
    "common.deposit": "Sätt in",
    "common.depositAndPlay": "Sätt in och spela",
    "common.withdraw": "Ta ut",
    "common.balance": "Saldo",
    "common.search": "Sök",
    "common.showAll": "Visa alla",
    "common.showMore": "Visa fler",
    "common.readMore": "Läs mer",
    "common.login": "Logga in",
    "common.register": "Registrera",
    "common.logout": "Logga ut",

    // Casino
    "casino.allGames": "Alla spel",
    "casino.newGames": "Nya spel",
    "casino.popular": "Populära",
    "casino.slots": "Slots",
    "casino.tableGames": "Bordsspel",
    "casino.liveCasino": "Live Casino",
    "casino.jackpots": "Jackpottar",
    "casino.providers": "Leverantörer",

    // Sports
    "sports.allSports": "Alla sporter",
    "sports.live": "Live just nu",
    "sports.upcoming": "Kommande",
    "sports.placeBet": "Lägg spel",
    "sports.betSlip": "Spelkupong",

    // Footer
    "footer.responsibleGambling": "Spela ansvarsfullt",
    "footer.license": "SwedBet drivs under svensk spellicens utfärdad av Spelinspektionen.",
    "footer.description": "Det smarta spelbolaget för svenska spelare. Licensierat av Spelinspektionen.",

    // Wallet
    "wallet.deposit": "Insättning",
    "wallet.withdraw": "Uttag",
    "wallet.history": "Historik",
    "wallet.amount": "Belopp",

    // Account
    "account.settings": "Kontoinställningar",
    "account.bonuses": "Erbjudanden",
  },
  en: {
    // Nav
    "nav.sport": "SPORT",
    "nav.slots": "SLOTS",
    "nav.blackjack": "BLACKJACK",
    "nav.roulette": "ROULETTE",
    "nav.live": "LIVE",

    // Common
    "common.play": "Play",
    "common.playNow": "Play now",
    "common.deposit": "Deposit",
    "common.depositAndPlay": "Deposit and play",
    "common.withdraw": "Withdraw",
    "common.balance": "Balance",
    "common.search": "Search",
    "common.showAll": "Show all",
    "common.showMore": "Show more",
    "common.readMore": "Read more",
    "common.login": "Log in",
    "common.register": "Register",
    "common.logout": "Log out",

    // Casino
    "casino.allGames": "All games",
    "casino.newGames": "New games",
    "casino.popular": "Popular",
    "casino.slots": "Slots",
    "casino.tableGames": "Table games",
    "casino.liveCasino": "Live Casino",
    "casino.jackpots": "Jackpots",
    "casino.providers": "Providers",

    // Sports
    "sports.allSports": "All sports",
    "sports.live": "Live now",
    "sports.upcoming": "Upcoming",
    "sports.placeBet": "Place bet",
    "sports.betSlip": "Bet slip",

    // Footer
    "footer.responsibleGambling": "Play responsibly",
    "footer.license": "SwedBet operates under a Swedish gambling license issued by Spelinspektionen.",
    "footer.description": "The smart gaming company. Licensed by Spelinspektionen.",

    // Wallet
    "wallet.deposit": "Deposit",
    "wallet.withdraw": "Withdrawal",
    "wallet.history": "History",
    "wallet.amount": "Amount",

    // Account
    "account.settings": "Account settings",
    "account.bonuses": "Bonuses",
  },
};

export function t(key: string, locale: string = "sv"): string {
  return translations[locale]?.[key] || translations["sv"]?.[key] || key;
}
