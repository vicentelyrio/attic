// Directory picking is non-standard, so React's input props don't cover it.
declare module 'react' {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string
  }
}

export {}
