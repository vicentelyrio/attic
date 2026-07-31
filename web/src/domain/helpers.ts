import type { Picked } from './entities'

export function downloadUrl(root: string, path: string, dl = false): string {
  const params = new URLSearchParams({ root, path })
  if (dl) params.set('dl', 'true')
  return `/api/download?${params}`
}

// An <input> only reports files, so empty folders are invisible to it.
export function pickFiles(list: FileList | File[] | null): Picked {
  if (!list) return { files: [], dirs: [] }
  return {
    files: Array.from(list).map((file) => ({
      file,
      rel: file.webkitRelativePath.split('/').slice(0, -1).join('/'),
    })),
    dirs: [],
  }
}

function fileOf(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject))
}

// readEntries hands back one batch at a time and signals the end with an empty
// one — a single call silently truncates directories past ~100 entries.
function readAll(
  reader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> {
  const all: FileSystemEntry[] = []
  return new Promise((resolve, reject) => {
    const next = () =>
      reader.readEntries((batch) => {
        if (batch.length === 0) return resolve(all)
        all.push(...batch)
        next()
      }, reject)
    next()
  })
}

async function walk(entry: FileSystemEntry, parent: string, out: Picked) {
  if (entry.isFile) {
    const file = await fileOf(entry as FileSystemFileEntry)
    out.files.push({ file, rel: parent })
    return
  }
  if (!entry.isDirectory) return

  const rel = parent ? `${parent}/${entry.name}` : entry.name
  const children = await readAll(
    (entry as FileSystemDirectoryEntry).createReader(),
  )
  // Only leaves need recording — creating one creates its ancestors too.
  if (children.length === 0) {
    out.dirs.push(rel)
    return
  }
  for (const child of children) await walk(child, rel, out)
}

export async function pickDropped(dt: DataTransfer): Promise<Picked> {
  // `items` is only readable during the event dispatch, so the entries have to
  // be taken before the first await — the list is emptied out from under us.
  const entries = Array.from(dt.items)
    .filter((it) => it.kind === 'file')
    .map((it) => it.webkitGetAsEntry())
    .filter((e) => e !== null)

  if (entries.length === 0) return pickFiles(dt.files)

  const out: Picked = { files: [], dirs: [] }
  for (const entry of entries) await walk(entry, '', out)
  return out
}
