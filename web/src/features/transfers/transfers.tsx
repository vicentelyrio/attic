import { ConflictDialog } from '../conflict-dialog'
import { ExpandedDock } from './expanded-dock'
import { useTransfers } from './hooks'
import { TransfersTrigger } from './transfers-trigger'

export function Transfers() {
  const state = useTransfers()

  return (
    <>
      <TransfersTrigger state={state} />

      {state.view === 'expanded' && <ExpandedDock state={state} />}

      {state.conflict && (
        <ConflictDialog
          job={state.conflict}
          onApply={state.applyResolve}
          onClose={state.closeConflict}
        />
      )}
    </>
  )
}
