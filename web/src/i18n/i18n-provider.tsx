import { type ReactNode, useEffect, useState } from 'react'

import { setDateLocale } from '@infrastructure'

import TypesafeI18n from './i18n-react'
import type { Locales } from './i18n-types'
import { detectLocale } from './i18n-util'
import { loadLocaleAsync } from './i18n-util.async'
import { browserLocaleDetector, storedLocaleDetector } from './locale'

/** Resolves the starting locale (stored choice first, then browser), loads its
 *  dictionary, then mounts the app. Renders nothing for the one tick the
 *  dynamic import takes. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locales>()

  useEffect(() => {
    const detected = detectLocale(storedLocaleDetector, browserLocaleDetector)
    loadLocaleAsync(detected).then(() => {
      setDateLocale(detected)
      setLocale(detected)
    })
  }, [])

  if (!locale) return null

  return <TypesafeI18n locale={locale}>{children}</TypesafeI18n>
}
