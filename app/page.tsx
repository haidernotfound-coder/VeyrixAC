import Link from "next/link";

const checks = [
  { name: "Speed (A)", cat: "movement", desc: "Horizontal movement past legal speed — potion, ice, slime and vehicle aware." },
  { name: "Flight (A)", cat: "movement", desc: "Models vanilla gravity across a full jump arc, both ascent and descent." },
  { name: "NoSlow (A)", cat: "movement", desc: "Full-speed movement while eating, blocking, or drawing a bow." },
  { name: "Jesus (A)", cat: "movement", desc: "Walking a water surface instead of swimming through it." },
  { name: "Reach (A)", cat: "combat", desc: "Melee attacks beyond legal distance from the target's hitbox." },
  { name: "Hitbox (A)", cat: "combat", desc: "Attacks whose look direction never intersects the target." },
  { name: "AutoTotem (A)", cat: "combat", desc: "Off-hand re-equip latency and resurrect reaction timing." },
  { name: "ShieldBreaker (A)", cat: "combat", desc: "Automated axe-swap shield disabling, swap→hit→swap-back." },
  { name: "Triggerbot (B)", cat: "combat · flagship", desc: "Fixed-interval landed hits plus abnormal swing efficiency." },
  { name: "AimAssist (B)", cat: "combat · flagship", desc: "Single-tick snaps onto a hitbox with no prior tracking." },
  { name: "FastBreak (A)", cat: "world", desc: "Block breaks faster than the vanilla dig-speed formula." },
  { name: "Scaffold (A)", cat: "world", desc: "Sustained blind bridge placement while airborne." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      {/* Nav */}
      <header className="border-b border-panel-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-medium tracking-tight">Veyrix</span>
            <span className="font-mono-data text-xs text-paper-dim">v1.0 · Paper 1.21.11</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-paper-dim">
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
        <div className="mx-auto max-w-6xl px-6 py-28">
          <div className="glow-border font-mono-data mb-6 inline-block rounded-sm border border-signal-dim px-3 py-1 text-xs text-signal">
            Built for Mounts of Mayhem — Minecraft 1.21.11
          </div>
          <h1 className="glow-text max-w-3xl text-5xl font-medium leading-[1.05] tracking-tight text-paper sm:text-6xl">
            An anticheat that tells you what a player did, not just that it flagged.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-paper-dim">
            Veyrix is a from-scratch Paper plugin: movement, combat, and world
            checks built around one rule — a check calls flag(), and never
            touches alerts, punishment, or storage itself. Every flag carries
            full evidence to staff; players only ever see a check name.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <a
              href="#licensing"
              className="glow-btn rounded-sm bg-signal px-5 py-3 font-medium text-ink transition-transform hover:scale-[1.02]"
            >
              Get a license
            </a>
            <a
              href="#checks"
              className="font-mono-data text-sm text-paper-dim hover:text-paper transition-colors"
            >
              See the detection surface
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-panel-line">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-panel-line sm:grid-cols-4">
          {[
            ["12+", "active checks"],
            ["6", "build phases"],
            ["0", "internal client dependency"],
            ["1.21.11", "target version"],
          ].map(([n, l]) => (
            <div key={l} className="px-6 py-8">
              <div className="font-mono-data text-2xl text-signal">{n}</div>
              <div className="mt-1 text-sm text-paper-dim">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Checks */}
      <section id="checks" className="border-b border-panel-line">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 max-w-lg">
            <h2 className="text-3xl font-medium tracking-tight">The detection surface</h2>
            <p className="mt-3 text-paper-dim">
              Every check is isolated to one question: did this player do
              something physically or mechanically impossible. Full list
              lives in the plugin README.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-panel-line bg-panel-line sm:grid-cols-2 lg:grid-cols-3">
            {checks.map((c) => (
              <div
                key={c.name}
                className="group relative bg-panel p-6 transition-colors hover:bg-[#0d1830]"
              >
                <div className="font-mono-data text-xs uppercase text-signal-dim">{c.cat}</div>
                <div className="mt-2 font-medium text-paper transition-colors group-hover:text-signal">
                  {c.name}
                </div>
                <p className="mt-2 text-sm text-paper-dim">{c.desc}</p>
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
              <h2 className="text-3xl font-medium tracking-tight">Licensing, plainly</h2>
              <p className="mt-4 text-paper-dim">
                Every build ships ProGuard-obfuscated and gated by a signed
                license key. Keys verify offline first — your server never
                needs to reach the internet for the plugin to run — and the
                plugin additionally checks in so your license stays
                revocable and your installs stay visible.
              </p>
              <ul className="mt-8 space-y-4 font-mono-data text-sm">
                <li className="flex gap-3">
                  <span className="text-signal">01</span>
                  <span className="text-paper-dim">HMAC-SHA256 signed keys, verified on-server</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-signal">02</span>
                  <span className="text-paper-dim">Bound to your server&apos;s public IP on activation</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-signal">03</span>
                  <span className="text-paper-dim">Periodic heartbeat keeps revocation effective within minutes</span>
                </li>
              </ul>
            </div>
            <div className="glow-border rounded-sm border border-panel-line bg-panel p-6">
              <div className="font-mono-data text-xs text-paper-dim">/veyrix license &lt;key&gt;</div>
              <div className="mt-4 space-y-2 font-mono-data text-sm">
                <div className="text-paper-dim">&gt; Verifying signature...</div>
                <div className="text-paper-dim">&gt; Resolving server IP...</div>
                <div className="text-signal">&gt; License activated successfully.</div>
                <div className="text-paper-dim">&gt; Licensed until 2027-03-01T00:00:00Z.</div>
              </div>

              <div className="mt-6 border-t border-panel-line pt-6">
                <div className="text-sm text-paper">Don&apos;t have a key yet?</div>
                <p className="mt-2 text-xs text-paper-dim">
                  Keys are issued by hand over Discord. Join the server, and
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
                plugin downloads and stays licensed automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="border-b border-panel-line">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-medium tracking-tight">Build phases</h2>
          <div className="mt-10 space-y-0 border-t border-panel-line">
            {[
              ["Phase 0", "Core architecture", "done"],
              ["Phase 1", "Movement checks — NoSlow (A) false-kick fix applied", "done"],
              ["Phase 2", "Combat checks, incl. Triggerbot A/B & AimAssist A/B", "done"],
              ["Phase 3", "Packet-level checks (Timer A / InvalidMove A / PacketOrder A)", "disabled pending retune"],
              ["Phase 4", "World & interaction checks, flag-only by design", "done"],
              ["Phase 5", "Punishment execution — AutoBan + staff tempbans", "first pass"],
            ].map(([phase, desc, status]) => (
              <div
                key={phase}
                className="flex flex-col gap-1 border-b border-panel-line py-5 sm:flex-row sm:items-center sm:gap-6"
              >
                <div className="font-mono-data w-24 shrink-0 text-signal">{phase}</div>
                <div className="flex-1 text-paper">{desc}</div>
                <div className="font-mono-data text-xs text-paper-dim">{status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-paper-dim">
        Veyrix — built for Mounts of Mayhem (1.21.11). Not affiliated with Mojang or Microsoft.
      </footer>
    </main>
  );
}
