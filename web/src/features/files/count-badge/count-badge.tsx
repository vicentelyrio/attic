import classes from './count-badge.module.css'

export type CountBadgeProps = {
  count: number
}

export function CountBadge({ count }: CountBadgeProps) {
  return <span className={classes.badge}>{count.toLocaleString()}</span>
}
