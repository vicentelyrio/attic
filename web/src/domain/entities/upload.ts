export const UploadStatusMap = {
  waiting: 'waiting',
  uploading: 'uploading',
  done: 'done',
  error: 'error',
  canceled: 'canceled',
} as const

export type UploadStatus = keyof typeof UploadStatusMap

/** `rel` is the folder path relative to the upload target, '' for a loose file. */
export interface PickedFile {
  file: File
  rel: string
}

export interface Picked {
  files: PickedFile[]
  /** Folder paths holding no files at any depth. */
  dirs: string[]
}

export interface Upload {
  id: string
  file?: File
  isDir: boolean
  name: string
  rel: string
  size: number
  loaded: number
  status: UploadStatus
  error?: string
}
