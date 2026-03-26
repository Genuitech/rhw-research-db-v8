import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import SearchClient from "./search-client"

async function handleSignOut() {
  "use server"
  await signOut({ redirectTo: "/auth/signin" })
}

export default async function SearchPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return <SearchClient session={session} onSignOut={handleSignOut} />
}
