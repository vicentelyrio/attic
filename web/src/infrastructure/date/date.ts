import dayjs from 'dayjs'
import 'dayjs/locale/es'
import 'dayjs/locale/pt-br'
import duration from 'dayjs/plugin/duration'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)

const DAYJS_LOCALES: Record<string, string> = {
  en: 'en',
  es: 'es',
  'pt-BR': 'pt-br',
}

/** Keep dayjs's relative/localized formats in step with the app locale. */
export function setDateLocale(locale: string) {
  dayjs.locale(DAYJS_LOCALES[locale] ?? 'en')
}

export { dayjs }
