import SignInClient from "./signin-client"

// Read on the server so we never expose env vars to the browser
const entraConfigured =
  !!process.env.AZURE_AD_CLIENT_ID &&
  !!process.env.AZURE_AD_CLIENT_SECRET &&
  !!process.env.AZURE_AD_TENANT_ID

export default function SignInPage() {
  return <SignInClient entraConfigured={entraConfigured} />
}
