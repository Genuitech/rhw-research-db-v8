import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"

export default async function SearchPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">RHW Research</h1>
            <p className="text-sm text-slate-400">{session.user.email}</p>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/auth/signin" })
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">Research Search</h2>
          <p className="text-slate-400 mb-6">
            Coming soon: AI-powered search across research documents
          </p>

          {/* Search Interface Placeholder */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Ask about research topics..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
            />
            <button className="w-full px-4 py-3 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors">
              Search
            </button>
          </div>

          {/* Results Placeholder */}
          <div className="mt-8">
            <p className="text-sm text-slate-500">No results yet. Start searching to get answers.</p>
          </div>
        </div>
      </div>

      {/* Admin Section */}
      {session.user.isAdmin && (
        <div className="max-w-6xl mx-auto px-4 py-8 border-t border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Admin Panel</h3>
          <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <p className="text-slate-400 mb-4">Content approval and management tools</p>
            <button className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors">
              View Pending Approvals
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
