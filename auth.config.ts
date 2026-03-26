import { type NextAuthConfig } from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import Credentials from "next-auth/providers/credentials"

// Entra is active when all three Azure AD env vars are present.
const entraConfigured =
  !!process.env.AZURE_AD_CLIENT_ID &&
  !!process.env.AZURE_AD_CLIENT_SECRET &&
  !!process.env.AZURE_AD_TENANT_ID

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isAuthPage = request.nextUrl.pathname.startsWith("/auth")
      if (isAuthPage) return true

      const isPublicPage = ["/", "/api/health"].includes(request.nextUrl.pathname)
      if (isPublicPage) return true

      return !!auth
    },
    async jwt({ token, user }) {
      if (user) {
        // Determine admin status from ADMIN_EMAILS env var (comma-separated list)
        token.isAdmin =
          process.env.ADMIN_EMAILS?.split(",")
            .map((e) => e.trim().toLowerCase())
            .includes((user.email ?? "").toLowerCase()) ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || ""
        // @ts-ignore - extend session type
        session.user.isAdmin = token.isAdmin || false
      }
      return session
    },
  },
  providers: [
    // ── Production: Microsoft Entra ID (Azure AD) ──────────────────────────
    // Active when AZURE_AD_CLIENT_ID / SECRET / TENANT_ID are set.
    // IT: create an App Registration in Azure AD and set the redirect URI to:
    //   https://<your-domain>/api/auth/callback/microsoft-entra-id
    ...(entraConfigured
      ? [
          MicrosoftEntraID({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            // Single-tenant: scope login to RHW's Azure AD directory
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
          }),
        ]
      : []),

    // ── Development fallback: Credentials ─────────────────────────────────
    // Only active when Entra is NOT configured. Any email + password works.
    // Never exposed in production once AZURE_AD_* vars are set.
    ...(!entraConfigured
      ? [
          Credentials({
            name: "Dev Account",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              if (credentials?.email && credentials?.password) {
                return {
                  id: String(credentials.email),
                  name: "Dev User",
                  email: String(credentials.email),
                }
              }
              return null
            },
          }),
        ]
      : []),
  ],
}
