'use client'

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("azure-ad", {
        redirect: true,
        callbackUrl: "/search",
      })
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
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

        {/* Login Card */}
        <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-200 mb-2">Sign In</h2>
              <p className="text-sm text-slate-400">
                Use your RHW CPAs Entra ID account to continue
              </p>
            </div>

            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                isLoading
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
              }`}
            >
              {isLoading ? "Signing in..." : "Sign In with Entra ID"}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700/50"></div>
              <span className="text-xs text-slate-500">Enterprise SSO</span>
              <div className="flex-1 h-px bg-slate-700/50"></div>
            </div>

            <p className="text-xs text-slate-500 text-center">
              RHW CPAs staff only. Unauthorized access is prohibited.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© 2026 RHW CPAs. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
