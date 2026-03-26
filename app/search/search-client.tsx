'use client'

import { useEffect, useState } from "react"

interface ResearchEntry {
  id: string
  title: string
  content: string
  type: string
  topic: string
  status: string
  isPrivate: boolean
  createdAt: string
  author: string
}

interface SearchResponse {
  data: ResearchEntry[]
  total: number
}

export default function SearchClient({ session, signOut }: any) {
  const [entries, setEntries] = useState<ResearchEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load research entries
    const loadEntries = async () => {
      try {
        const response = await fetch("/api/search")
        if (response.ok) {
          const data: SearchResponse = await response.json()
          setEntries(data.data)
        }
      } catch (error) {
        console.error("Failed to load entries:", error)
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data: SearchResponse = await response.json()
        setEntries(data.data)
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ redirectTo: "/auth/signin" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">RHW Research</h1>
            <p className="text-sm text-slate-400">{session?.user?.email}</p>
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
        {/* Search Box */}
        <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm mb-8">
          <h2 className="text-xl font-semibold text-slate-200 mb-6">Research Database</h2>

          <form onSubmit={handleSearch} className="space-y-4">
            <input
              type="text"
              placeholder="Search research entries (e.g., 'IRC 529', 'tax planning')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
            />
            <button
              type="submit"
              className="w-full px-4 py-3 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading research entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm text-center">
              <p className="text-slate-400">No results found. Try a different search.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">Found {entries.length} result{entries.length !== 1 ? "s" : ""}</p>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm hover:border-sky-400/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-100 mb-2">{entry.title}</h3>
                      <p className="text-slate-300 text-sm mb-3 line-clamp-2">{entry.content}</p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="px-2 py-1 bg-sky-500/20 text-sky-300 text-xs rounded">
                          {entry.type}
                        </span>
                        <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded">
                          {entry.topic}
                        </span>
                        <span className="text-xs text-slate-500">
                          by {entry.author}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Admin Section */}
      {session?.user?.isAdmin && (
        <div className="max-w-6xl mx-auto px-4 py-8 border-t border-slate-700/50">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Admin Panel</h3>
          <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <p className="text-slate-400 mb-4">Total entries: {entries.length}</p>
            <button className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors">
              Add New Entry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
