"use client"

/**
 * Wraps a screen that only means something with an account behind it.
 *
 * Search is the one thing that works signed out, so everything else invites
 * you to sign in rather than pretending to work. Waits for ready before
 * deciding, otherwise a signed-in person sees the invitation flash first.
 */

import { useAuth } from "./AuthProvider"
import LoginGate from "./LoginGate"

export default function RequireAuth({
  title,
  text,
  children,
}: {
  title: string
  text: string
  children: React.ReactNode
}) {
  const { signedIn, ready } = useAuth()

  if (!ready) return null
  if (!signedIn) return <LoginGate title={title} text={text} />

  return <>{children}</>
}
