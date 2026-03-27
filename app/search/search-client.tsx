'use client'

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import SummaryModal from "./summary-modal"
import type { FileResult } from "@/app/api/search/route"

// ── File-type display helpers ────────────────────────────────────────────────

const FILE_TYPE_FILTERS = [
  { value: "all",  label: "All" },
  { value: "pdf",  label: "PDF" },
  { value: "docx", label: "Word" },
  { value: "xlsx", label: "Excel" },
  { value: "txt",  label: "Text" },
]

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf:  "bg-red-500/20 text-red-300 border-red-500/30",
  docx: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  doc:  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  xlsx: "bg-green-500/20 text-green-300 border-green-500/30",
  xls:  "bg-green-500/20 text-green-300 border-green-500/30",
  txt:  "bg-slate-500/20 text-slate-300 border-slate-500/30",
  csv:  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  md:   "bg-purple-500/20 text-purple-300 border-purple-500/30",
}

function fileTypeBadgeClass(ext: string) {
  return FILE_TYPE_COLORS[ext.toLowerCase()] ?? "bg-slate-700/50 text-slate-400 border-slate-600/30"
}

/** Convert P:\Data\Tax\2024\file.pdf → Tax / 2024 */
function displayPath(folderPath: string): string {
  // Strip drive + Data root, normalise separators
  const cleaned = folderPath.replace(/^[A-Za-z]:[/\\]?Data[/\\]?/i, "").replace(/\\/g, "/")
  const parts = cleaned.split("/").filter(Boolean)
  if (parts.length === 0) return "File Server"
  return parts.slice(0, 4).join(" / ")
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function similarityLabel(sim: number | null): string | null {
  if (sim === null || sim === undefined) return null
  return `${Math.round(sim * 100)}%`
}

function similarityColor(sim: number | null): string {
  if (!sim) return "bg-slate-700 text-slate-400"
  if (sim >= 0.85) return "bg-sky-500/25 text-sky-300 border-sky-500/40"
  if (sim >= 0.70) return "bg-amber-500/20 text-amber-300 border-amber-500/40"
  return "bg-slate-700/50 text-slate-400 border-slate-600/40"
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SearchClient({
  session,
  onSignOut,
}: {
  session: any
  onSignOut: () => Promise<void>
}) {
  const [entries, setEntries] = useState<FileResult[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeType, setActiveType] = useState("all")
  const [loading, setLoading] = useState(true)
  const [noIndex, setNoIndex] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [summaryIds, setSummaryIds] = useState<number[]>([])
  const [summaryNames, setSummaryNames] = useState<string[]>([])
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const entryRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const fetchEntries = async (q: string, type: string) => {
    setLoading(true)
    setSelectedIds(new Set())
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (type && type !== "all") params.set("type", type)
      const res = await fetch(`/api/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data.data ?? [])
        setNoIndex(!!data.noIndex)
      }
    } catch (err) {
      console.error("Search failed:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEntries("", "all") }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchEntries(searchQuery, activeType)
  }

  const handleTypeFilter = (type: string) => {
    setActiveType(type)
    fetchEntries(searchQuery, type)
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const openSummary = (ids: number[]) => {
    const names = entries
      .filter((e) => ids.includes(e.id))
      .map((e) => e.file_name)
    setSummaryIds(ids)
    setSummaryNames(names)
    setShowSummaryModal(true)
  }

  const handleSourceClick = async (entryId: string) => {
    setShowSummaryModal(false)
    const numId = parseInt(entryId, 10)
    // If the entry isn't in the current result set, reset to browse mode
    const inView = entries.some((e) => e.id === numId)
    if (!inView) {
      setSearchQuery("")
      setActiveType("all")
      await fetchEntries("", "all")
    }
    setTimeout(() => {
      const el = entryRefs.current[numId]
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.classList.add("ring-2", "ring-sky-400/60")
        setTimeout(() => el.classList.remove("ring-2", "ring-sky-400/60"), 2000)
      }
    }, 300)
  }

  const isSearching = !!searchQuery.trim()
  const visibleIds = entries.map((e) => e.id)
  const selectedCount = selectedIds.size

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">

      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <div className="border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">

          {/* Top row: logo + user + sign out */}
          <div className="flex items-center justify-between py-3 border-b border-slate-800/60">
            <div>
              <span className="text-lg font-bold text-slate-100">RHW Portal</span>
              <span className="ml-3 text-xs text-slate-500">{session?.user?.email}</span>
            </div>
            <form action={onSignOut}>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>

          {/* Three-pillar navigation tabs */}
          <nav className="flex gap-1 py-2">
            <span className="px-4 py-2 text-sm font-semibold text-sky-300 bg-sky-950/60 border border-sky-500/30 rounded-lg">
              Document Search
            </span>
            <Link
              href="/research"
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span className="text-sky-400">✦</span> AI Research
            </Link>
            <span className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg cursor-not-allowed flex items-center gap-1.5">
              HR Documents
              <span className="text-[10px] bg-slate-800 text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">Soon</span>
            </span>
          </nav>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Search box */}
        <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-200">Document Search</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Semantic search across P:\Data — powered by AI embeddings
              </p>
            </div>
            <button
              onClick={() => openSummary(selectedCount > 0 ? Array.from(selectedIds) : visibleIds)}
              disabled={entries.length === 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              📊 AI Summary{selectedCount > 0 ? ` (${selectedCount})` : ""}
            </button>
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={'e.g. "depreciation schedule", "401k plan", "client onboarding"'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400/50 text-sm"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
              >
                Search
              </button>
            </div>

            {/* File type chips */}
            <div className="flex gap-2 flex-wrap">
              {FILE_TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => handleTypeFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    activeType === f.value
                      ? "bg-sky-500 text-white border-sky-500"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Floating selection bar */}
        {selectedCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-sky-500/40 rounded-2xl px-5 py-3 shadow-xl flex items-center gap-4">
            <span className="text-sm text-slate-300">
              <span className="font-semibold text-sky-300">{selectedCount}</span> file{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => openSummary(Array.from(selectedIds))}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              📊 Summarize
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-sky-500/50 border-t-sky-400 rounded-full animate-spin mb-3" />
            <p className="text-slate-400 text-sm">
              {isSearching ? "Searching…" : "Loading documents…"}
            </p>
          </div>
        ) : noIndex ? (
          <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-10 backdrop-blur-sm text-center">
            <p className="text-3xl mb-3">🗂</p>
            <p className="text-slate-200 font-medium mb-1">File index not yet built</p>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Once the rhw-knowledge-search crawler runs against P:\Data, documents will appear here automatically.
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="glass bg-slate-900/40 border border-slate-700/50 rounded-2xl p-10 backdrop-blur-sm text-center">
            <p className="text-slate-400">No documents found. Try a different search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              {isSearching
                ? `${entries.length} result${entries.length !== 1 ? "s" : ""} for "${searchQuery}"`
                : `${entries.length} most recent document${entries.length !== 1 ? "s" : ""} — search to find specific files`}
            </p>

            {entries.map((entry) => {
              const sim = entry.similarity
              const simLabel = similarityLabel(sim)
              const isSelected = selectedIds.has(entry.id)

              return (
                <div
                  key={entry.id}
                  id={`doc-${entry.id}`}
                  ref={(el) => { entryRefs.current[entry.id] = el }}
                  className={`glass bg-slate-900/40 border rounded-2xl p-5 backdrop-blur-sm transition-all ${
                    isSelected
                      ? "border-sky-500/60 bg-sky-950/20"
                      : "border-slate-700/50 hover:border-sky-400/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelect(entry.id)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border transition-colors ${
                        isSelected
                          ? "bg-sky-500 border-sky-500"
                          : "bg-slate-800 border-slate-600 hover:border-sky-400"
                      }`}
                      aria-label={isSelected ? "Deselect" : "Select for summary"}
                    >
                      {isSelected && (
                        <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${fileTypeBadgeClass(entry.file_type)}`}>
                          {entry.file_type.toUpperCase()}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-100 truncate">
                          {entry.file_name}
                        </h3>
                        {simLabel && (
                          <span className={`ml-auto flex-shrink-0 px-2 py-0.5 text-xs font-mono rounded border ${similarityColor(sim)}`}>
                            {simLabel} match
                          </span>
                        )}
                      </div>

                      {/* Path */}
                      <p className="text-xs text-slate-500 mb-2 truncate">
                        📁 {displayPath(entry.folder_path)}
                      </p>

                      {/* Preview */}
                      {entry.text_preview && (
                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                          {entry.text_preview}
                        </p>
                      )}

                      {/* Footer meta */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                        {entry.modified_at && (
                          <span>Modified {new Date(entry.modified_at).toLocaleDateString()}</span>
                        )}
                        {entry.file_size && (
                          <span>{formatSize(entry.file_size)}</span>
                        )}
                        <span className="ml-auto font-mono text-[10px] text-slate-700 truncate max-w-xs">
                          {entry.file_path}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Summary Modal */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        fileIds={summaryIds}
        fileNames={summaryNames}
        onSourceClick={handleSourceClick}
      />
    </div>
  )
}
