import type { Metadata } from 'next'
import {
  Barlow_Condensed,
  Space_Grotesk,
  Inter,
  Space_Mono,
  Syne,
} from 'next/font/google'
import './globals.css'
import GlobalPlayerMount from '@/components/layout/GlobalPlayerMount'

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: '800',
  variable: '--font-display',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-headline',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-label',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Page KillerCutz | Ghana DJ',
  description:
    'Page KillerCutz — Master of the decks. Experience the ultimate Afrobeat and Highlife fusion from Accra, Ghana.',
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon/favicon.ico',
    apple: '/favicon/apple-touch-icon.png',
    other: [
      { rel: 'android-chrome-192x192', url: '/favicon/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/favicon/android-chrome-512x512.png' },
    ],
  },
  manifest: '/favicon/site.webmanifest',
  openGraph: {
    title: 'Page KillerCutz | Ghana DJ',
    description:
      'Page KillerCutz — Master of the decks. Experience the ultimate Afrobeat and Highlife fusion from Accra, Ghana.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={[
        barlowCondensed.variable,
        spaceGrotesk.variable,
        inter.variable,
        spaceMono.variable,
        syne.variable,
        'dark',
      ].join(' ')}
    >
      <head>
        {/* Material Symbols Outlined — variable icon font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-background text-on-surface font-body antialiased">
        {children}
        <GlobalPlayerMount />
      </body>
    </html>
  )
}
