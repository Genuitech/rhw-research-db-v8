import Link from "next/link"

const ERROR_MESSAGES: Record<string, { title: string; detail: string }> = {
  Configuration: {
    title: "Server configuration error",
    detail: "The authentication provider is not configured correctly. Contact your IT administrator.",
  },
  AccessDenied: {
    title: "Access denied",
    detail: "Your account does not have permission to access RHW Research. Contact your administrator to request access.",
  },
  Verification: {
    title: "Sign-in link expired",
    detail: "The sign-in link has expired or already been used. Please request a new one.",
  },
  OAuthSignin: {
    title: "Microsoft sign-in failed",
    detail: "Could not initiate sign-in with Microsoft. Please try again or contact IT if the problem persists.",
  },
  OAuthCallback: {
    title: "Microsoft sign-in failed",
    detail: "An error occurred during the Microsoft sign-in callback. Please try again.",
  },
  OAuthAccountNotLinked: {
    title: "Account not linked",
    detail: "This email is already associated with a different sign-in method.",
  },
  Default: {
    title: "Authentication error",
    detail: "An unexpected error occurred during sign-in. Please try again.",
  },
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const info = ERROR_MESSAGES[error ?? ""] ?? ERROR_MESSAGES.Default

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent mb-2">
            RHW Research
          </h1>
        </div>

        <div className="glass bg-slate-900/40 border border-red-500/30 rounded-2xl p-8 backdrop-blur-sm space-y-5">
          {/* Error icon */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-lg">
              ⚠️
            </div>
            <h2 className="text-lg font-semibold text-slate-100">{info.title}</h2>
          </div>

          <p className="text-sm text-slate-400 leading-relaxed">{info.detail}</p>

          {error && (
            <p className="text-xs text-slate-600 font-mono bg-slate-800/50 px-3 py-2 rounded-lg">
              Error code: {error}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/auth/signin"
              className="w-full flex items-center justify-center px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition-colors text-sm"
            >
              Try signing in again
            </Link>
            <a
              href="mailto:it@rhwcpas.com?subject=RHW Research Portal - Sign-in Error&body=Error code: {error ?? 'unknown'}"
              className="w-full flex items-center justify-center px-4 py-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Contact IT support →
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© 2026 RHW CPAs. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
