interface Props {
  root: string | null
  path: string
  onNavigate: (path: string) => void
}

export function Breadcrumbs({ root, path, onNavigate }: Props) {
  const segments = path ? path.split('/') : []
  return (
    <nav className="breadcrumbs">
      <button
        type="button"
        className="crumb root"
        onClick={() => onNavigate('')}
      >
        {root ?? '—'}
      </button>
      {segments.map((seg, i) => {
        const target = segments.slice(0, i + 1).join('/')
        return (
          <span key={target} className="crumb-group">
            <span className="sep">/</span>
            <button
              type="button"
              className="crumb"
              onClick={() => onNavigate(target)}
            >
              {seg}
            </button>
          </span>
        )
      })}
    </nav>
  )
}
