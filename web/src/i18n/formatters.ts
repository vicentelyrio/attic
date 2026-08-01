import type { FormattersInitializer } from 'typesafe-i18n'
import type { Locales, Formatters } from './i18n-types'

export const initFormatters: FormattersInitializer<Locales, Formatters> = (locale: Locales) => {

	const formatters: Formatters = {
		// Thousands grouping for the active locale, e.g. "12,480" / "12.480".
		n: (value: unknown) => Number(value).toLocaleString(locale),
	}

	return formatters
}
