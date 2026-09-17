import RedeemClient from "./redeem-client";

export default function RedeemPage() {
  return (
    <main className="grain min-h-screen bg-ink px-6 py-16 text-paper">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="font-mono-data text-xs uppercase tracking-wide text-signal-dim">
            Veyrix
          </div>
          <h1 className="glow-text mt-2 text-2xl font-medium">Redeem your PIN</h1>
          <p className="mt-2 text-sm text-paper-dim">
            Enter the 6-digit code you were given to download the plugin.
            Each code works once.
          </p>
        </div>
        <RedeemClient />
      </div>
    </main>
  );
}
