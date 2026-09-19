import Link from "next/link";

const checks = [
  { name: "Speed", id: "A", cat: "movement", desc: "Horizontal movement past legal speed — potion, ice, slime and vehicle aware." },
  { name: "Flight", id: "A", cat: "movement", desc: "Models vanilla gravity across a full jump arc, both ascent and descent." },
  { name: "NoSlow", id: "A", cat: "movement", desc: "Full-speed movement while eating, blocking, or drawing a bow." },
  { name: "Jesus", id: "A", cat: "movement", desc: "Walking a water surface instead of swimming through it." },
  { name: "Reach", id: "A", cat: "combat", desc: "Melee attacks beyond legal distance from the target's hitbox." },
  { name: "Hitbox", id: "A", cat: "combat", desc: "Attacks whose look direction never intersects the target." },
  { name: "AutoTotem", id: "A", cat: "combat", desc: "Off-hand re-equip latency and resurrect reaction timing." },
  { name: "ShieldBreaker", id: "A", cat: "combat", desc: "Automated axe-swap shield disabling, swap, hit, swap back." },
  { name: "Triggerbot", id: "B", cat: "combat", flagship: true, desc: "Fixed-interval landed hits plus abnormal swing efficiency." },
  { name: "AimAssist", id: "B", cat: "combat", flagship: true, desc: "Single-tick snaps onto a hitbox with no prior tracking." },
  { name: "FastBreak", id: "A", cat: "world", desc: "Block breaks faster than the vanilla dig-speed formula." },
  { name: "Scaffold", id: "A", cat: "world", desc: "Sustained blind bridge placement while airborne." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      {/* Nav */}
      <header className="border-b border-panel-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display text-xl italic tracking-tight">Veyrix</span>
            <span className="font-mono-data text-[11px] text-paper-dim">1.21.1–1.21.11</span>
          </div>
          <nav className="flex items-center gap-7 text-[15px] text-paper-dim">
            <Link href="#checks" className="hover:text-paper transition-colors">Checks</Link>
            <Link href="#licensing" className="hover:text-paper transition-colors">Licensing</Link>
            <Link href="#roadmap" className="hover:text-paper transition-colors">Roadmap</Link>
            <a
              href="https://discord.gg/xJ2nFUEs7u"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-signal transition-colors"
            >
              Discord
            </a>
            <Link href="/redeem" className="hover:text-signal transition-colors">
              Download
            </Link>
            <Link
              href="/admin"
              className="rounded-sm border border-panel-line px-3.5 py-1.5 text-paper hover:border-signal hover:text-signal transition-colors"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="instrument-field border-b border-panel-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:py-32">
          <div>
            <h1 className="max-w-xl text-[2.75rem] font-medium leading-[1.08] tracking-tight text-paper sm:text-[3.4rem]">
              <span className="font-display italic text-signal glow-text">Evidence,</span>{" "}
              not just a verdict.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-paper-dim">
              Veyrix is a Paper anticheat built from scratch for Mounts of
              Mayhem. Every check answers one question — did this player do
              something physically impossible — and hands staff the measured
              reason, down to the millisecond.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#licensing"
                className="glow-btn rounded-sm bg-signal px-5 py-3 font-medium text-ink transition-transform hover:scale-[1.02]"
              >
                Get a license
              </a>
              <Link
                href="/redeem"
                className="rounded-sm border border-panel-line px-5 py-3 font-medium text-paper transition-colors hover:border-signal hover:text-signal"
              >
                Download the jar
              </Link>
            </div>
          </div>

          {/* Readout panel — the hero's one bold element */}
          <div className="tick-frame rounded-sm border border-panel-line bg-panel/80 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-panel-line pb-3">
              <span className="font-mono-data text-[11px] text-paper-dim">TriggerbotB.java — live flag</span>
              <span className="flex items-center gap-1.5 text-[11px] text-alert">
                <span className="h-1.5 w-1.5 rounded-full bg-alert" />
                flagged
              </span>
            </div>
            <dl className="mt-4 space-y-2.5 font-mono-data text-[13px]">
              {[
                ["player", "kirano_pvp"],
                ["landed hits", "7 / 7 @ 214ms ± 12"],
                ["facing gate", "hitbox-locked, 2 ticks"],
                ["swing efficiency", "0.97 (25 swings)"],
                ["verdict", "AutoBan · 5d"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-paper-dim">{k}</dt>
                  <dd className={k === "verdict" ? "text-alert" : "text-paper"}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 border-t border-panel-line pt-4 text-xs leading-relaxed text-paper-dim">
              This is what staff see. The player only ever sees{" "}
              <span className="font-mono-data text-paper">Triggerbot</span> on
              the ban screen — full evidence never leaks the detection method.
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-panel-line">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-panel-line sm:grid-cols-4">
          {[
            ["12", "checks shipping now"],
            ["3", "packet checks paused for retune"],
            ["0", "third-party client dependency"],
            ["5d", "default AutoBan length"],
          ].map(([n, l]) => (
            <div key={l} className="px-6 py-8">
              <div className="font-display text-3xl italic text-signal">{n}</div>
              <div className="mt-1 text-sm text-paper-dim">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Checks — technical log, not a card grid */}
      <section id="checks" className="border-b border-panel-line">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 max-w-lg">
            <h2 className="font-display text-3xl italic tracking-tight">The detection surface</h2>
            <p className="mt-3 text-paper-dim">
              Checks never touch alerts or punishment directly — they call
              flag(), and a single pipeline decides what happens next. Full
              writeup for each check lives in the plugin README.
            </p>
          </div>
          <div className="overflow-hidden rounded-sm border border-panel-line">
            {checks.map((c, i) => (
              <div
                key={c.name}
                className={`group grid grid-cols-[auto_1fr_auto] items-center gap-6 px-6 py-4 transition-colors hover:bg-panel-raised ${
                  i !== checks.length - 1 ? "border-b border-panel-line" : ""
                }`}
              >
                <div className="font-mono-data w-32 shrink-0 text-sm text-paper">
                  {c.name} <span className="text-signal-dim">({c.id})</span>
                </div>
                <p className="text-sm text-paper-dim">{c.desc}</p>
                <div className="flex shrink-0 items-center gap-3">
                  {c.flagship && (
                    <span className="font-mono-data text-[10px] text-signal">flagship</span>
                  )}
                  <span className="font-mono-data text-[10px] text-paper-dim">{c.cat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Licensing */}
      <section id="licensing" className="border-b border-panel-line">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="font-display text-3xl italic tracking-tight">Licensing, plainly</h2>
              <p className="mt-4 text-paper-dim">
                Every build ships obfuscated and gated by a signed license
                key. Keys verify offline first, so your server never needs to
                reach the internet just to run the plugin — it additionally
                checks in on a short interval so a revoked or expired key
                stops working within minutes, not on next restart.
              </p>
              <div className="mt-8 space-y-5 border-t border-panel-line pt-6">
                <div className="flex gap-4">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                  <p className="text-sm text-paper-dim">
                    <span className="text-paper">HMAC-SHA256 signed keys</span>, verified on your server
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                  <p className="text-sm text-paper-dim">
                    <span className="text-paper">Bound to your server&apos;s IP</span> the moment you activate
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                  <p className="text-sm text-paper-dim">
                    <span className="text-paper">Live revocation</span> — a pulled key disables detection without a restart
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-sm border border-panel-line bg-panel p-6">
              <div className="font-mono-data text-xs text-paper-dim">/veyrix license &lt;key&gt;</div>
              <div className="mt-4 space-y-2 font-mono-data text-sm">
                <div className="text-paper-dim">&gt; Verifying signature...</div>
                <div className="text-paper-dim">&gt; Resolving server IP...</div>
                <div className="text-signal">&gt; License activated successfully.</div>
                <div className="text-paper-dim">&gt; Licensed until 2027-03-01T00:00:00Z.</div>
              </div>

              <div className="mt-6 border-t border-panel-line pt-6">
                <div className="text-sm text-paper">Don&apos;t have a key yet?</div>
                <p className="mt-2 text-xs leading-relaxed text-paper-dim">
                  Keys are issued by hand over Discord. Join the server and
                  the author will generate one for you from the license
                  dashboard.
                </p>
                <a
                  href="https://discord.gg/xJ2nFUEs7u"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glow-btn mt-4 inline-flex items-center gap-2 rounded-sm bg-signal px-4 py-2.5 text-sm font-medium text-ink transition-transform hover:scale-[1.02]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
                  </svg>
                  Join the Discord
                </a>
              </div>

              <p className="mt-6 text-xs text-paper-dim">
                Already have a key? Use it in-game with{" "}
                <span className="font-mono-data text-paper">/veyrix license &lt;key&gt;</span> — the
                plugin stays licensed automatically from then on.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="border-b border-panel-line">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl italic tracking-tight">Build phases</h2>
          <div className="mt-10 space-y-0 border-t border-panel-line">
            {[
              ["Phase 0", "Core architecture", "done"],
              ["Phase 1", "Movement checks — NoSlow false-kick fix applied", "done"],
              ["Phase 2", "Combat checks, incl. Triggerbot A/B & AimAssist A/B", "done"],
              ["Phase 3", "Packet-level checks (Timer / InvalidMove / PacketOrder)", "paused for retune"],
              ["Phase 4", "World & interaction checks, flag-only by design", "done"],
              ["Phase 5", "Punishment execution — AutoBan + staff tempbans", "first pass"],
            ].map(([phase, desc, status]) => (
              <div
                key={phase}
                className="flex flex-col gap-1 border-b border-panel-line py-5 sm:flex-row sm:items-center sm:gap-6"
              >
                <div className="font-mono-data w-24 shrink-0 text-signal">{phase}</div>
                <div className="flex-1 text-paper">{desc}</div>
                <div
                  className={`font-mono-data text-xs ${
                    status === "done" ? "text-paper-dim" : "text-signal"
                  }`}
                >
                  {status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-paper-dim">
        Veyrix — built for Paper 1.21.1–1.21.11 (Mounts of Mayhem is the newest). Not affiliated with Mojang or Microsoft.
      </footer>
    </main>
  );
}
