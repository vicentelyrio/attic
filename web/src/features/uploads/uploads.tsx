import { CollapsedDock } from './collapsed-dock'
import { useUploadManager } from './hooks'
import { UploadModal } from './upload-modal'
import { UploadTrigger } from './upload-trigger'

export type UploadsProps = {
  root: string
  path: string
}

export function Uploads({ root, path }: UploadsProps) {
  const state = useUploadManager(root, path)

  return (
    <>
      <UploadTrigger onOpen={state.open} />

      <UploadModal state={state} />

      {state.view === 'collapsed' && <CollapsedDock state={state} />}
    </>
  )
}
