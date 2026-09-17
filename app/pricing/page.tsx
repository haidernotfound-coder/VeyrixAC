import Link from "next/link";

const tiers = [
  {
    name: "Monthly",
    price: "$5",
    period: "/mo",
    salePrice: "$2.50",
    blurb: "Full detection suite, billed monthly. Cancel anytime.",
    features: [
      "Every check in the detection surface",
      "Remote revoke/heartbeat license sync",
      "Access to every published build",
      "Support over Discord",
    ],
  },
  {
    name: "Lifetime",
    price: "$10",
    period: "one-time",
    salePrice: "$5.00",
    blurb: "Pay once, keep every future update — no renewals.",
    features: [
      "Everything in Monthly",
      "Never expires, no recurring cost",
      "All future builds included",
      "Priority support over Discord",
    ],
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      {/* Nav */}
      <header className="border-b border-panel-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-medium tracking-tight">Veyrix</span>
            <span className="font-mono-data text-xs text-paper-dim">v1.0 · Paper 1.21.11</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-paper-dim">
            <Link href="/#checks" className="hover:text-paper transition-colors">Checks</Link>
            <Link href="/pricing" className="text-signal">Pricing</Link>
            <Link href="/#roadmap" className="hover:text-paper transition-colors">Roadmap</Link>
            <Link href="/redeem" className="hover:text-signal transition-colors">Download</Link>
            <Link
              href="/admin"
              className="rounded-sm border border-panel-line px-3 py-1.5 text-paper hover:border-signal hover:text-signal transition-colors"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="grain border-b border-panel-line">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="glow-border font-mono-data mb-6 inline-block rounded-sm border border-signal-dim px-3 py-1 text-xs text-signal">
            Limited-time launch pricing — 50% off
          </div>
          <h1 className="glow-text text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl">
            Simple pricing, no hidden tiers.
          </h1>
          <p className="mt-4 text-lg text-paper-dim">
            Keys are issued by hand over Discord — join the server and the
            author will set you up.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="border-b border-panel-line">
        <div className="mx-auto grid max-w-4xl gap-6 px-6 py-16 sm:grid-cols-2">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-sm border p-8 ${
                t.highlighted
                  ? "glow-border border-signal-dim bg-panel"
                  : "border-panel-line bg-panel"
              }`}
            >
              {t.highlighted && (
                <div className="font-mono-data absolute -top-3 left-8 rounded-sm bg-signal px-2 py-0.5 text-xs font-medium text-ink">
                  Best value
                </div>
              )}
              <div className="font-mono-data text-xs uppercase tracking-wide text-signal-dim">
                {t.name}
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono-data text-sm text-paper-dim line-through">
                  {t.price}
                </span>
                <span className="glow-text text-4xl font-medium text-signal">{t.salePrice}</span>
                <span className="text-sm text-paper-dim">{t.period}</span>
              </div>
              <p className="mt-1 text-xs text-paper-dim">
                Regular price {t.price}{t.period !== "one-time" ? t.period : ""} — 50% off for a
                limited time.
              </p>

              <p className="mt-5 text-sm text-paper-dim">{t.blurb}</p>

              <ul className="mt-6 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-paper-dim">
                    <span className="mt-0.5 text-signal">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="https://discord.gg/xJ2nFUEs7u"
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 flex w-full items-center justify-center gap-2 rounded-sm px-5 py-3 text-sm font-medium transition-transform hover:scale-[1.02] ${
                  t.highlighted
                    ? "glow-btn bg-signal text-ink"
                    : "border border-signal-dim text-signal hover:bg-signal/10"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
                </svg>
                Buy on Discord
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* How buying works */}
      <section className="border-b border-panel-line">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-medium tracking-tight">How it works</h2>
          <ol className="mt-6 space-y-4 font-mono-data text-sm">
            <li className="flex gap-3">
              <span className="text-signal">01</span>
              <span className="text-paper-dim">
                Join the Discord and let the author know which plan you want.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-signal">02</span>
              <span className="text-paper-dim">
                Pay however you arrange it there — you&apos;ll get a license key.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-signal">03</span>
              <span className="text-paper-dim">
                Grab the jar from <Link href="/redeem" className="text-signal hover:underline">/redeem</Link>{" "}
                and activate it with <span className="text-paper">/veyrix license &lt;key&gt;</span>.
              </span>
            </li>
          </ol>
          <a
            href="https://discord.gg/xJ2nFUEs7u"
            target="_blank"
            rel="noopener noreferrer"
            className="glow-btn mt-8 inline-flex items-center gap-2 rounded-sm bg-signal px-5 py-3 text-sm font-medium text-ink transition-transform hover:scale-[1.02]"
          >
            Join the Discord to buy
          </a>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-paper-dim">
        Veyrix — built for Mounts of Mayhem (1.21.11). Not affiliated with Mojang or Microsoft.
      </footer>
    </main>
  );
}
