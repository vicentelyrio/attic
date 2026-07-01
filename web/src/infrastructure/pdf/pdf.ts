// `?url` resolves to the worker asset path only (a tiny string), so it does not
// pull pdf.js into the initial bundle — the library itself is dynamically
// imported the first time a PDF is previewed.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

/** Cap the backing-store resolution so thumbnails stay cheap on hi-dpi screens. */
const MAX_DPR = 2

/** Loads pdf.js once and configures its worker; shared across all previews. */
let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null
function loadPdfjs() {
  pdfjsPromise ??= import('pdfjs-dist').then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
    return pdfjs
  })
  return pdfjsPromise
}

export type PdfThumbnailHandle = { cancel: () => void }

export type PdfThumbnailOptions = {
  /** CSS width the thumbnail is displayed at, used to pick a render scale. */
  width?: number
  onError?: () => void
}

/**
 * Render the first page of a PDF into `canvas` as a thumbnail. Returns a handle
 * whose `cancel()` aborts in-flight loading/rendering — call it on unmount.
 */
export function renderPdfThumbnail(
  canvas: HTMLCanvasElement,
  url: string,
  { width = 480, onError }: PdfThumbnailOptions = {},
): PdfThumbnailHandle {
  let cancelled = false
  let cancel = () => {
    cancelled = true
  }

  ;(async () => {
    try {
      const pdfjs = await loadPdfjs()
      if (cancelled) return

      // disableAutoFetch keeps large PDFs from downloading in full — pdf.js
      // range-requests just the bytes needed for page 1 (backend honours Range).
      const loadingTask = pdfjs.getDocument({ url, disableAutoFetch: true })
      cancel = () => {
        cancelled = true
        loadingTask.destroy()
      }

      const pdf = await loadingTask.promise
      if (cancelled) return

      const page = await pdf.getPage(1)
      if (cancelled) return

      const base = page.getViewport({ scale: 1 })
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const viewport = page.getViewport({ scale: (width / base.width) * dpr })

      canvas.width = viewport.width
      canvas.height = viewport.height

      const renderTask = page.render({ canvas, viewport })
      cancel = () => {
        cancelled = true
        renderTask.cancel()
        loadingTask.destroy()
      }
      await renderTask.promise
    } catch {
      // RenderingCancelledException on unmount is expected; ignore when cancelled.
      if (!cancelled) onError?.()
    }
  })()

  return { cancel: () => cancel() }
}
