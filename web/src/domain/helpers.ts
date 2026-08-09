import type { Picked } from './entities'

export function downloadUrl(root: string, path: string, dl = false): string {
  const params = new URLSearchParams({ root, path })
  if (dl) params.set('dl', 'true')
  return `/api/download?${params}`
}

export function thumbnailUrl(root: string, path: string): string {
  const params = new URLSearchParams({ root, path })
  return `/api/thumbnail?${params}`
}

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

  if (children.length === 0) {
    out.dirs.push(rel)
    return
  }
  for (const child of children) await walk(child, rel, out)
}

export async function pickDropped(dt: DataTransfer): Promise<Picked> {
  const entries = Array.from(dt.items)
    .filter((it) => it.kind === 'file')
    .map((it) => it.webkitGetAsEntry())
    .filter((e) => e !== null)

  if (entries.length === 0) return pickFiles(dt.files)

  const out: Picked = { files: [], dirs: [] }
  for (const entry of entries) await walk(entry, '', out)
  return out
}
