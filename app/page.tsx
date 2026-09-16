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
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="font-mono-data mb-6 inline-block rounded-sm border border-signal-dim px-3 py-1 text-xs text-signal">
            Built for Mounts of Mayhem — Minecraft 1.21.11
          </div>
          <h1 className="max-w-3xl text-5xl font-medium leading-[1.05] tracking-tight text-paper sm:text-6xl">
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
              className="rounded-sm bg-signal px-5 py-3 font-medium text-ink transition-transform hover:scale-[1.02]"
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
              <div key={c.name} className="bg-panel p-6">
                <div className="font-mono-data text-xs uppercase text-signal-dim">{c.cat}</div>
                <div className="mt-2 font-medium text-paper">{c.name}</div>
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
            <div className="rounded-sm border border-panel-line bg-panel p-6">
              <div className="font-mono-data text-xs text-paper-dim">/veyrix license &lt;key&gt;</div>
              <div className="mt-4 space-y-2 font-mono-data text-sm">
                <div className="text-paper-dim">&gt; Verifying signature...</div>
                <div className="text-paper-dim">&gt; Resolving server IP...</div>
                <div className="text-signal">&gt; License activated successfully.</div>
                <div className="text-paper-dim">&gt; Licensed until 2027-03-01T00:00:00Z.</div>
              </div>
              <p className="mt-6 text-xs text-paper-dim">
                Lost a key or need it moved to a new IP? Contact the plugin
                author — the admin panel can reissue or revoke on request.
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
