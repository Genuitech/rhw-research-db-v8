'use client'

import { useState } from "react"

interface SummaryModalProps {
  isOpen: boolean
  onClose: () => void
  suggestedTopics: string[]
}

interface SummaryResult {
  summary: string
  keyPoints: string[]
  contradictions: Array<{
    issue: string
    document1: { id: string; quote: string }
    document2: { id: string; quote: string }
    severity: "HIGH" | "MEDIUM" | "LOW"
  }>
  sources: Array<{
    id: string
    title: string
    author: string
    topic: string
  }>
}

export default function SummaryModal({
  isOpen,
  onClose,
  suggestedTopics,
}: SummaryModalProps) {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [error, setError] = useState("")

  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) {
      setError("Please enter a topic")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      })

      if (!response.ok) throw new Error("Failed to generate summary")

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Topic Summary</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!result ? (
            /* Topic Selection Form */
            <>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  Select or Enter a Topic
                </label>

                {/* Suggested Topics Dropdown */}
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 mb-2 focus:outline-none focus:border-sky-400"
                >
                  <option value="">-- Select from suggestions --</option>
                  {suggestedTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                {/* Or Free-Text Input */}
                <input
                  type="text"
                  placeholder="Or type a custom topic..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <button
                onClick={handleGenerateSummary}
                disabled={loading}
                className="w-full px-4 py-3 bg-sky-500 text-white rounded-lg font-medium hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Generating Summary..." : "Generate Summary"}
              </button>
            </>
          ) : (
            /* Summary Results */
            <>
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-3">
                  Summary: {topic}
                </h3>
                <p className="text-slate-300 leading-relaxed">{result.summary}</p>
              </div>

              {result.keyPoints.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-100 mb-2">
                    Key Points
                  </h4>
                  <ul className="space-y-2">
                    {result.keyPoints.map((point, i) => (
                      <li key={i} className="text-slate-300 text-sm flex gap-2">
                        <span className="text-sky-400">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.contradictions.length > 0 && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                  <h4 className="font-semibold text-red-300 mb-3">
                    ⚠️ Contradictions Found
                  </h4>
                  <div className="space-y-3">
                    {result.contradictions.map((cont, i) => (
                      <div key={i} className="text-sm">
                        <p className="text-slate-200 font-medium mb-2">
                          {cont.issue}
                        </p>
                        <div className="space-y-1 text-slate-300">
                          <p className="text-xs">
                            <span className="text-slate-400">Document 1:</span>{" "}
                            "{cont.document1.quote}"
                          </p>
                          <p className="text-xs">
                            <span className="text-slate-400">Document 2:</span>{" "}
                            "{cont.document2.quote}"
                          </p>
                        </div>
                        <span
                          className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                            cont.severity === "HIGH"
                              ? "bg-red-900/50 text-red-300"
                              : cont.severity === "MEDIUM"
                                ? "bg-yellow-900/50 text-yellow-300"
                                : "bg-blue-900/50 text-blue-300"
                          }`}
                        >
                          {cont.severity} Severity
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.sources.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-100 mb-3">
                    Source Documents
                  </h4>
                  <div className="space-y-2">
                    {result.sources.map((source) => (
                      <a
                        key={source.id}
                        href={`#doc-${source.id}`}
                        className="block p-3 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:border-sky-400/50 transition-colors"
                      >
                        <p className="text-sky-400 font-medium text-sm">
                          {source.title}
                        </p>
                        <p className="text-slate-400 text-xs">
                          by {source.author}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setResult(null)
                  setTopic("")
                }}
                className="w-full px-4 py-2 bg-slate-700 text-slate-200 rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                Generate Another Summary
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
