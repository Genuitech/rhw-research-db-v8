"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

function MessageActions({ content, question }: { content: string; question: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${question}</title>
        <style>
          body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
          h1 { font-size: 1.4em; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
          h2 { font-size: 1.1em; margin-top: 1.5em; }
          strong { font-weight: 600; }
          hr { border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }
          .header { font-size: 0.8em; color: #666; margin-bottom: 24px; }
          .footer { font-size: 0.75em; color: #888; margin-top: 32px; border-top: 1px solid #eee; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">RHW CPAs — AI Research · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
        <h1>${question}</h1>
        <div>${content.replace(/\n/g, "<br>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/^## (.+)$/gm, "<h2>$1</h2>").replace(/^# (.+)$/gm, "<h1>$1</h1>").replace(/^---$/gm, "<hr>")}</div>
        <div class="footer">AI answers may be incorrect or outdated. Always verify tax positions with authoritative sources (IRS publications, state guidance, CCH, Thomson Reuters).</div>
      </body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  function handleEmail() {
    const subject = encodeURIComponent(`Tax Research: ${question}`)
    const body = encodeURIComponent(
      `${question}\n\n${content}\n\n---\nAI research via RHW Research Portal · ${new Date().toLocaleDateString()}\nAlways verify with authoritative sources.`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <div className="flex gap-2 mt-2 ml-11">
      <button onClick={handleCopy} className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg transition-colors">
        {copied ? "✓ Copied" : "Copy"}
      </button>
      <button onClick={handlePrint} className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg transition-colors">
        Print / Save PDF
      </button>
      <button onClick={handleEmail} className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg transition-colors">
        Draft Email
      </button>
    </div>
  )
}

interface Message {
  role: "user" | "assistant"
  content: string
}

interface RateLimit {
  remaining: number
  used: number
  limit: number
}

export default function ResearchPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [detailed, setDetailed] = useState(false)
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  // Load usage on mount
  useEffect(() => {
    fetch("/api/research")
      .then((r) => {
        if (r.status === 401) { router.push("/auth/signin"); return null }
        return r.json()
      })
      .then((data) => data && setRateLimit(data))
      .catch(() => {})
  }, [router])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question || streaming) return

    setError(null)
    setInput("")
    const newMessages = [...messages, { role: "user" as const, content: question }]
    setMessages([...newMessages, { role: "assistant", content: "" }])
    setStreaming(true)

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, detailed }),
      })

      if (res.status === 429) {
        const data = await res.json()
        setMessages((prev) => prev.slice(0, -1)) // remove empty assistant message
        setError(data.message || "Daily limit reached.")
        setRateLimit((prev) => prev ? { ...prev, remaining: 0 } : prev)
        return
      }

      if (!res.ok || !res.body) {
        setMessages((prev) => prev.slice(0, -1))
        setError("Failed to get a response. Please try again.")
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })

        // Check for meta marker at end
        if (chunk.includes("__META__")) {
          const parts = chunk.split("__META__")
          fullText += parts[0]
          try {
            const meta = JSON.parse(parts[1])
            setRateLimit({ remaining: meta.remaining, used: meta.limit - meta.remaining, limit: meta.limit })
          } catch {}
        } else {
          fullText += chunk
        }

        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: fullText }
          return updated
        })
      }
    } catch {
      setMessages((prev) => prev.slice(0, -1))
      setError("Connection error. Please try again.")
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e as unknown as React.FormEvent)
    }
  }

  const usedPercent = rateLimit ? (rateLimit.used / rateLimit.limit) * 100 : 0
  const limitColor =
    !rateLimit ? "bg-slate-700" :
    rateLimit.remaining > 10 ? "bg-sky-500" :
    rateLimit.remaining > 5 ? "bg-amber-500" :
    "bg-red-500"

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="text-slate-400 hover:text-slate-200 transition-colors text-sm"
            >
              ← Knowledge Base
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">AI Research</h1>
              <p className="text-xs text-slate-500">CPA-focused tax &amp; accounting assistant</p>
            </div>
          </div>

          {/* Usage meter */}
          {rateLimit && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`text-sm font-semibold font-mono ${rateLimit.remaining === 0 ? "text-red-400" : rateLimit.remaining <= 5 ? "text-amber-400" : "text-sky-400"}`}>
                  {rateLimit.remaining} / {rateLimit.limit}
                </p>
                <p className="text-xs text-slate-500">queries today</p>
              </div>
              <div className="w-32 h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${limitColor}`}
                  style={{ width: `${Math.max(4, 100 - usedPercent)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 mb-2">
              <span className="text-3xl">⚖️</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-200">Ask a tax or accounting question</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Powered by Claude. Answers are for professional reference — always verify with authoritative sources.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto mt-6 text-left">
              {[
                "What are the 2025 IRA contribution limits?",
                "Explain the Section 199A QBI deduction phase-out rules",
                "When is a GRAT better than a direct gift?",
                "What triggers an S-Corp reasonable compensation audit?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="glass bg-slate-900/40 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-300 hover:border-sky-400/50 hover:text-slate-100 transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col">
            <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sm">
                  ⚖️
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-sky-600/20 border border-sky-500/30 text-slate-100 rounded-br-sm whitespace-pre-wrap"
                    : "glass bg-slate-900/40 border border-slate-700/50 text-slate-200 rounded-bl-sm prose prose-sm prose-invert max-w-none"
                }`}
              >
                {msg.role === "user" ? msg.content : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
                {msg.role === "assistant" && streaming && i === messages.length - 1 && (
                  <span className="inline-block w-1.5 h-4 bg-sky-400 animate-pulse ml-0.5 rounded-sm align-text-bottom" />
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700/50 border border-slate-600/50 flex items-center justify-center text-sm">
                  👤
                </div>
              )}
            </div>
            {msg.role === "assistant" && !streaming && msg.content && (
              <MessageActions
                content={msg.content}
                question={messages[i - 1]?.content ?? "Tax Research"}
              />
            )}
          </div>
        ))}

        {error && (
          <div className="glass bg-red-950/40 border border-red-500/30 rounded-xl px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto px-4 pb-2">
        <p className="text-xs text-slate-600 text-center">
          AI answers may be incorrect or outdated. Always verify tax positions with authoritative sources (IRS publications, state guidance, CCH, Thomson Reuters).
        </p>
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 border-t border-slate-700/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={sendMessage} className="space-y-3">
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a tax or accounting question... (Enter to send, Shift+Enter for new line)"
                disabled={streaming || rateLimit?.remaining === 0}
                className="w-full px-4 py-3 pr-24 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400/50 resize-none text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim() || rateLimit?.remaining === 0}
                className="absolute right-3 bottom-3 px-4 py-1.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {streaming ? "..." : "Ask"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setDetailed((d) => !d)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${detailed ? "bg-purple-600" : "bg-slate-700"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${detailed ? "translate-x-4" : ""}`} />
                </div>
                <span className="text-xs text-slate-400">
                  Detailed mode{" "}
                  <span className="text-slate-600">(Sonnet — uses 1 query)</span>
                </span>
              </label>

              {rateLimit && rateLimit.remaining === 0 && (
                <div className="text-xs text-right space-y-1">
                  <p className="text-red-400 font-medium">Daily limit reached. Resets tomorrow.</p>
                  <p className="text-slate-500">
                    Continue on your own (unaudited):{" "}
                    <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-400 underline">Claude.ai</a>
                    {" · "}
                    <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:text-sky-400 underline">ChatGPT</a>
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
