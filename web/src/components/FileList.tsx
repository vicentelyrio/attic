import { type Entry, downloadUrl } from '@domain'

interface Props {
  entries: Entry[]
  root: string
  path: string
  onOpen: (name: string) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(1)} ${units[i]}`
}

export function FileList({ entries, root, path, onOpen }: Props) {
  if (entries.length === 0) {
    return <p className="muted">This folder is empty.</p>
  }
  return (
    <ul className="filelist">
      {entries.map((e) => {
        const fullPath = path ? `${path}/${e.name}` : e.name
        return (
          <li key={e.name} className="row">
            {e.is_dir ? (
              <button
                type="button"
                className="name dir"
                onClick={() => onOpen(e.name)}
              >
                <span className="icon">📁</span>
                <span className="label">{e.name}</span>
              </button>
            ) : (
              <a
                className="name file"
                href={downloadUrl(root, fullPath)}
                target="_blank"
                rel="noreferrer"
              >
                <span className="icon">📄</span>
                <span className="label">{e.name}</span>
              </a>
            )}
            <span className="size">{e.is_dir ? '' : formatSize(e.size)}</span>
            {!e.is_dir && (
              <a
                className="dl"
                href={downloadUrl(root, fullPath, true)}
                title="Download"
              >
                ↓
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
