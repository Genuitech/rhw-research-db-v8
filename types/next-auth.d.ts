import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id?: string
    isAdmin?: boolean
  }

  interface Session {
    user: User & {
      isAdmin?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean
  }
}
