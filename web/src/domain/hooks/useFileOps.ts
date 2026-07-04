import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  createFile,
  createFolder,
  type Entry,
  paste,
  trashEntries,
} from '@domain'

/** Filesystem mutations for the current directory: create a folder/file,
 *  duplicate entries, and move entries to the trash. Each refreshes the
 *  directory listing on success so the change shows without waiting for the
 *  poll. Duplicate reuses the copy-job pipeline (a copy onto the same folder
 *  lands as "name copy"), so it surfaces in the transfers panel like any paste. */
export function useFileOps(root: string, path: string) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['list', root, path] })

  const rel = (name: string) => (path ? `${path}/${name}` : name)

  const mkdir = useMutation({
    mutationFn: (name: string) => createFolder({ root, dir: path, name }),
    onSuccess: refresh,
  })

  const touch = useMutation({
    mutationFn: (name: string) => createFile({ root, dir: path, name }),
    onSuccess: refresh,
  })

  const duplicate = useMutation({
    mutationFn: async (entries: Entry[]) => {
      for (const entry of entries) {
        await paste({
          op: 'copy',
          src_root: root,
          src_path: rel(entry.name),
          dst_root: root,
          dst_dir: path,
        })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })

  const remove = useMutation({
    mutationFn: (entries: Entry[]) =>
      trashEntries(
        root,
        entries.map((e) => rel(e.name)),
      ),
    onSuccess: refresh,
  })

  return { mkdir, touch, duplicate, remove }
}
