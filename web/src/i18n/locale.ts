import type { Locales } from './i18n-types'
import { isLocale, locales } from './i18n-util'

const STORAGE_KEY = 'attic.locale'

/** The locale the user explicitly picked, if any. */
export function storedLocaleDetector(): string[] {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored && isLocale(stored) ? [stored] : []
}

/** Browser preferences, widened so `pt` matches `pt-BR` and `es-AR` matches `es`. */
export function browserLocaleDetector(): string[] {
  return navigator.languages.flatMap((lang) => {
    const base = lang.split('-')[0]
    return locales.filter((locale) => locale.split('-')[0] === base)
  })
}

export function storeLocale(locale: Locales) {
  localStorage.setItem(STORAGE_KEY, locale)
}
