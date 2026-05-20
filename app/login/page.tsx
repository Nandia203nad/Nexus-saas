"use client";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4 py-12">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/20">
        <div className="space-y-6 text-center">
          <h1 className="text-3xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-400">Use Google to sign in and access your Nexus dashboard.</p>
          <button
            className="w-full rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            onClick={() => { window.location.href = '/api/auth/google/start?redirect=/home'; }}
          >
            Login with Google
          </button>
        </div>
      </div>
    </main>
  );
}
