import { dayjs } from './date'

export function relativeTime(ms: number) {
  const date = dayjs.unix(ms)
  const diff = dayjs().diff(date, 'days')

  if (diff <= 7) return date.fromNow()

  return date.format('LL')
}
