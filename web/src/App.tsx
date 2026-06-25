import { useEffect, useState } from 'react'
import { useRoots, useDirectory } from './hooks/queries'
import { RootPicker } from './components/RootPicker'
import { Breadcrumbs } from './components/Breadcrumbs'
import { FileList } from './components/FileList'

export function App() {
  const roots = useRoots()
  const [root, setRoot] = useState<string | null>(null)
  const [path, setPath] = useState('')

  // Default to the first root once the list arrives.
  useEffect(() => {
    if (root === null && roots.data && roots.data.length > 0) {
      setRoot(roots.data[0])
    }
  }, [root, roots.data])

  const dir = useDirectory(root, path)

  function open(name: string) {
    setPath((p) => (p ? `${p}/${name}` : name))
  }

  function changeRoot(r: string) {
    setRoot(r)
    setPath('')
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>files</h1>
        {roots.data && (
          <RootPicker roots={roots.data} current={root} onChange={changeRoot} />
        )}
      </header>

      <Breadcrumbs root={root} path={path} onNavigate={setPath} />

      <main className="content">
        {roots.isError && <p className="error">Could not reach the server.</p>}
        {dir.isLoading && <p className="muted">Loading…</p>}
        {dir.isError && <p className="error">Failed to load this folder.</p>}
        {dir.data && root && (
          <FileList entries={dir.data} root={root} path={path} onOpen={open} />
        )}
      </main>
    </div>
  )
}
