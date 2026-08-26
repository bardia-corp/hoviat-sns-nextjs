"use client"

/**
 * Holds whichever person is currently being previewed.
 *
 * Any card on any route can call open(person), and a single modal instance
 * mounted in the layout renders it. That avoids one dialog per card, and keeps
 * the result list itself a server component.
 */

import { createContext, useContext, useMemo, useState } from "react"
import type { Profile } from "@/lib/people"

type PersonModalValue = {
  person: Profile | null
  open: (person: Profile) => void
  close: () => void
}

const PersonModalContext = createContext<PersonModalValue | null>(null)

export function PersonModalProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [person, setPerson] = useState<Profile | null>(null)

  const value = useMemo<PersonModalValue>(
    () => ({
      person,
      open: (next: Profile) => setPerson(next),
      close: () => setPerson(null),
    }),
    [person]
  )

  return (
    <PersonModalContext.Provider value={value}>
      {children}
    </PersonModalContext.Provider>
  )
}

export function usePersonModal(): PersonModalValue {
  const value = useContext(PersonModalContext)
  if (!value) {
    throw new Error("usePersonModal must be used inside PersonModalProvider")
  }
  return value
}
