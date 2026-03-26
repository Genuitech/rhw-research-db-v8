import { type NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request }) {
      // Allow auth pages without authentication
      const isAuthPage = request.nextUrl.pathname.startsWith("/auth")
      if (isAuthPage) return true

      // Allow public pages
      const isPublicPage = ["/", "/api/health"].includes(request.nextUrl.pathname)
      if (isPublicPage) return true

      // Require auth for everything else
      return !!auth
    },
    async jwt({ token, user }) {
      // Persist admin status
      if (user) {
        token.isAdmin = process.env.ADMIN_EMAILS?.split(",").includes(user.email || "") ?? false
      }
      // Initialize research rate limit tracking if missing
      if (token.researchDate === undefined) {
        token.researchDate = ""
        token.researchQueries = 0
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ""
        // @ts-ignore - extend session type
        session.user.isAdmin = token.isAdmin || false
        // @ts-ignore - extend session type
        session.user.researchQueries = token.researchQueries ?? 0
        // @ts-ignore - extend session type
        session.user.researchDate = token.researchDate ?? ""
      }
      return session
    },
  },
  providers: [
    // Temporary: Credentials provider for development
    // TODO: Replace with Azure AD provider for production
    Credentials({
      name: "Test Account",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // For development only - in production, validate against Entra ID
        if (credentials?.email && credentials?.password) {
          return {
            id: "1",
            name: "Test User",
            email: String(credentials.email),
          }
        }
        return null
      },
    }),
  ],
}
