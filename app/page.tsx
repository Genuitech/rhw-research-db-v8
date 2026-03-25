import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()

  // If authenticated, redirect to search
  if (session?.user) {
    redirect("/search")
  }

  // Otherwise show landing page
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Branding */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <h1 className="text-6xl font-bold gradient-text mb-4">RHW Research</h1>
            <p className="text-xl text-slate-400">Knowledge base powered by AI</p>
          </div>

          <div className="flex justify-center gap-2 mb-8">
            <div className="h-1 w-12 bg-gradient-to-r from-sky-400 to-transparent rounded-full"></div>
            <div className="h-1 w-12 bg-gradient-to-r from-transparent to-blue-400 rounded-full"></div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Search Card */}
          <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm hover:border-sky-400/30 transition-all duration-300 group">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2 group-hover:text-sky-300 transition-colors">
              AI Search
            </h3>
            <p className="text-sm text-slate-400">
              Ask questions about research across thousands of memos and SOPs
            </p>
          </div>

          {/* Research Card */}
          <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm hover:border-blue-400/30 transition-all duration-300 group">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2 group-hover:text-blue-300 transition-colors">
              Knowledge Base
            </h3>
            <p className="text-sm text-slate-400">
              Curated collection of firm SOPs, policies, and client Q&As
            </p>
          </div>

          {/* Secure Card */}
          <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm hover:border-emerald-400/30 transition-all duration-300 group">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2 group-hover:text-emerald-300 transition-colors">
              Enterprise SSO
            </h3>
            <p className="text-sm text-slate-400">
              Role-based access with Entra ID integration
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/auth/signin"
            className="inline-block px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 active:scale-95"
          >
            Sign In with Entra ID
          </a>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-700/50 text-center">
          <p className="text-xs text-slate-500">© 2026 RHW CPAs. All rights reserved.</p>
          <p className="text-xs text-slate-600 mt-2">Staff access only. Unauthorized use is prohibited.</p>
        </div>
      </div>
    </div>
  )
}
