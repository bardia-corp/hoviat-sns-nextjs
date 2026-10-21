import type { Metadata, Viewport } from "next"
import { Suspense } from "react"
import "./globals.css"
import "./business.css"
import "./input-focus.css"
import AuroraBackground from "@/components/AuroraBackground"
import BottomNav from "@/components/BottomNav"
import { AuthProvider } from "@/components/AuthProvider"
import { BookmarksProvider } from "@/components/BookmarksProvider"
import { PersonModalProvider } from "@/components/PersonModalProvider"
import { NavProgressProvider } from "@/components/NavProgress"
import PersonModal from "@/components/PersonModal"
import { BusinessBookmarksProvider } from "@/components/BusinessBookmarksProvider"

/**
 * Root layout.
 *
 * The aurora, the bottom nav and the bookmark store live here so they persist
 * across route changes: navigating between tabs re-renders only the page body,
 * not the background or the nav.
 *
 * lang="fa" and dir="rtl" are set once, here. Everything downstream uses
 * logical CSS properties, so the layout mirrors from this one attribute rather
 * than from per-component overrides.
 */

export const metadata: Metadata = {
  title: "هویت | کشف کسب‌وکارها و خدمات",
  description:
    "کسب‌وکارها و خدمات مرتبط با جامعهٔ فارسی‌زبان را در آلمان پیدا کنید، ذخیره کنید و اطلاعات کسب‌وکار خود را مدیریت کنید.",
  applicationName: "هویت",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Matches --bg-page, so the browser chrome blends into the background. */
  themeColor: "#DCEEF9",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        {/* Vazirmatn from Google Fonts rather than next/font, deliberately.
            next/font downloads the file at build time, which turns a missing
            network into a failed build. A stylesheet link degrades to the
            system font instead. preconnect covers the two hosts the CSS then
            pulls the font file from. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <BookmarksProvider>
            <BusinessBookmarksProvider>
            <PersonModalProvider>
              <AuroraBackground />
              {/* NavProgressProvider reads the query string to know when a
                  navigation finished, and useSearchParams has to sit inside a
                  Suspense boundary or it opts every page out of static
                  rendering. */}
              <Suspense fallback={null}>
                <NavProgressProvider navigation={<BottomNav />}>{children}</NavProgressProvider>
              </Suspense>
              {/* One dialog instance for the whole app: any card on any route
                  opens it through the provider. */}
              <PersonModal />
            </PersonModalProvider>
            </BusinessBookmarksProvider>
          </BookmarksProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
