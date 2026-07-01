/** Lazy-loads the markdown renderer + sanitizer once, shared across previews. */
let libsPromise: Promise<{
  marked: typeof import('marked').marked
  DOMPurify: typeof import('dompurify').default
}> | null = null
function loadLibs() {
  libsPromise ??= Promise.all([import('marked'), import('dompurify')]).then(
    ([{ marked }, { default: DOMPurify }]) => ({ marked, DOMPurify }),
  )
  return libsPromise
}

/** Render markdown to sanitized HTML. Raw HTML in the source is scrubbed. */
export async function renderMarkdown(text: string): Promise<string> {
  const { marked, DOMPurify } = await loadLibs()
  const html = marked.parse(text, { async: false })
  return DOMPurify.sanitize(html)
}
