import { setDateLocale } from '@infrastructure'

import { useI18nContext } from './i18n-react'
import type { Locales } from './i18n-types'
import { locales } from './i18n-util'
import { loadLocaleAsync } from './i18n-util.async'
import { storeLocale } from './locale'

/** Locale switching that loads the dictionary before applying it, and persists
 *  the choice so it survives reloads. */
export function useLocale() {
  const { locale, setLocale } = useI18nContext()

  const change = async (next: Locales) => {
    if (next === locale) return
    await loadLocaleAsync(next)
    setDateLocale(next)
    storeLocale(next)
    setLocale(next)
  }

  return { locale, locales, setLocale: change }
}
