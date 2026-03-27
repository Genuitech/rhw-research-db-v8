'use client'

import { useState } from "react"

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  fileIds: number[]
  fileNames: string[]
  onSourceClick: (entryId: string) => void
}

interface SummaryResult {
  summary: string
  keyPoints: string[]
  sources: Array<{ id: string; title: string; path: string }>
}

export default function SummaryModal({
  isOpen,
  onClose,
  fileIds,
  fileNames,
  onSourceClick,
}: SummaryModalProps) {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [error, setError] = useState("")

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: fileIds, question: question.trim() || undefined }),
      })

      if (!res.ok) throw new Error("Failed to generate summary")
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setResult(null)
    setQuestion("")
    setError("")
    onClose()
  }

  if (!isOpen) return null

  const previewNames = fileNames.slice(0, 3)
  const overflow = fileNames.length - 3

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">AI Document Summary</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-200 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* File list preview */}
          <div>
            <p className="text-xs text-slate-500 mb-2">
              Summarizing {fileIds.length} file{fileIds.length !== 1 ? "s" : ""}:
            </p>
            <div className="space-y-1">
              {previewNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-slate-600">📄</span>
                  <span className="truncate">{name}</span>
                </div>
              ))}
              {overflow > 0 && (
                <p className="text-xs text-slate-500 pl-6">… and {overflow} more</p>
              )}
            </div>
          </div>

          {!result ? (
            /* Input form */
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Specific question{" "}
                  <span className="text-slate-600 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder={'e.g. "What are the key deadlines?" or "Summarize procedures"'}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 text-sm"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-sm"
              >
                {loading ? "Generating…" : "Generate Summary"}
              </button>
            </form>
          ) : (
            /* Results */
            <>
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Summary</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
              </div>

              {result.keyPoints.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Key Points</h3>
                  <ul className="space-y-1.5">
                    {result.keyPoints.map((pt, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="text-sky-400 flex-shrink-0">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.sources.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Source Files</h3>
                  <div className="space-y-1.5">
                    {result.sources.map((src) => (
                      <button
                        key={src.id}
                        onClick={() => onSourceClick(src.id)}
                        className="w-full text-left p-3 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:border-sky-400/50 transition-colors"
                      >
                        <p className="text-sky-400 text-sm font-medium truncate">{src.title}</p>
                        <p className="text-slate-500 text-xs truncate mt-0.5">{src.path}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => { setResult(null); setQuestion("") }}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors text-sm"
              >
                Start Over
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
