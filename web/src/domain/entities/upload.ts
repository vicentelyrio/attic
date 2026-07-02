export type UploadStatus =
  | 'waiting'
  | 'uploading'
  | 'done'
  | 'error'
  | 'canceled'

/** A single queued file upload, tracked client-side. Progress and abort live
 *  entirely in the browser — the backend just receives the streamed bytes. */
export interface Upload {
  id: string
  file: File
  name: string
  size: number
  loaded: number
  status: UploadStatus
  error?: string
}
