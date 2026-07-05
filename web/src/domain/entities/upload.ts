export const UploadStatusMap = {
  waiting: 'waiting',
  uploading: 'uploading',
  done: 'done',
  error: 'error',
  canceled: 'canceled',
} as const

export type UploadStatus = keyof typeof UploadStatusMap

export interface Upload {
  id: string
  file: File
  name: string
  size: number
  loaded: number
  status: UploadStatus
  error?: string
}
