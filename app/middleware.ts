import { auth } from "@/auth"

export const middleware = auth((req) => {
  // Auth.js handles the authorization callback
  // If auth is null, the authorized callback in auth.config.ts will redirect
  return undefined
})

export const config = {
  // Protect all routes except /auth and /api/health
  matcher: ["/((?!auth|api/health|_next/static|favicon.ico).*)"],
}
