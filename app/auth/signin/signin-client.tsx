'use client'

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function SignInClient({ entraConfigured }: { entraConfigured: boolean }) {
  const [isLoading, setIsLoading] = useState(false)
  const [devOpen, setDevOpen] = useState(false)

  async function handleMicrosoft() {
    setIsLoading(true)
    await signIn("microsoft-entra-id", { callbackUrl: "/search" })
    // signIn redirects, so setIsLoading(false) is never reached — that's fine
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    const form = new FormData(e.currentTarget as HTMLFormElement)
    await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: true,
      callbackUrl: "/search",
    })
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent mb-2">
            RHW Research
          </h1>
          <p className="text-slate-400">AI-powered knowledge database</p>
        </div>

        <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-200 mb-1">Sign In</h2>
            <p className="text-sm text-slate-400">
              {entraConfigured
                ? "Use your RHW Microsoft account"
                : "Development mode — Entra SSO not configured"}
            </p>
          </div>

          {/* ── Microsoft SSO button (production) ─────────────────────── */}
          {entraConfigured && (
            <button
              onClick={handleMicrosoft}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0078d4] hover:bg-[#106ebe] text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Microsoft logo */}
              <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              {isLoading ? "Redirecting…" : "Sign in with Microsoft"}
            </button>
          )}

          {/* ── Dev credentials fallback (no Entra) ───────────────────── */}
          {!entraConfigured && (
            <form onSubmit={handleCredentials} className="space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />
              <input
                type="password"
                name="password"
                placeholder="Password (any value)"
                required
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-400"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in…" : "Sign In"}
              </button>
              <p className="text-xs text-slate-500 text-center">
                Dev mode — any email + password combination works
              </p>
            </form>
          )}

          {/* ── Dev escape hatch when Entra IS configured ─────────────── */}
          {entraConfigured && process.env.NODE_ENV !== "production" && (
            <div className="border-t border-slate-700/50 pt-4">
              <button
                onClick={() => setDevOpen((v) => !v)}
                className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
              >
                {devOpen ? "Hide" : "Dev login ↓"}
              </button>
              {devOpen && (
                <p className="mt-2 text-xs text-amber-400/70">
                  Dev credentials login is disabled — Entra is configured.
                  Unset AZURE_AD_CLIENT_ID to re-enable.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© 2026 RHW CPAs. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
