import { useState } from 'react'

import {
  Button,
  Group,
  Modal,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
} from '@mantine/core'

import type { JobView, Policy, Resolution, ResolveReq } from '@domain'

export type ConflictDialogProps = {
  job: JobView
  onApply: (req: ResolveReq) => void
  onClose: () => void
}

const POLICY_DATA = [
  { label: 'Overwrite all', value: 'overwrite_all' },
  { label: 'Skip all', value: 'skip_all' },
]

const FILE_DATA = [
  { label: 'Overwrite', value: 'overwrite' },
  { label: 'Skip', value: 'skip' },
]

/** Prompt shown when a paste collides with existing files. Picks a default
 *  policy (overwrite/skip all) with optional per-file overrides, then hands a
 *  minimal `ResolveReq` (only the overrides that differ from the policy) back. */
export function ConflictDialog({ job, onApply, onClose }: ConflictDialogProps) {
  const conflicts = job.files.filter((f) => f.conflict)
  const [policy, setPolicy] = useState<Policy>('overwrite_all')
  const [overrides, setOverrides] = useState<Record<string, Resolution>>({})

  const policyRes: Resolution =
    policy === 'overwrite_all' ? 'overwrite' : 'skip'
  const choiceFor = (rel: string): Resolution => overrides[rel] ?? policyRes
  const setChoice = (rel: string, r: Resolution) =>
    setOverrides((o) => ({ ...o, [rel]: r }))

  const apply = () => {
    const diff: Record<string, Resolution> = {}
    for (const f of conflicts) {
      const choice = choiceFor(f.rel_path)
      if (choice !== policyRes) diff[f.rel_path] = choice
    }
    onApply({ policy, overrides: diff })
  }

  return (
    <Modal
      opened
      onClose={onClose}
      title="Resolve conflicts"
      size="lg"
      centered
    >
      <Stack>
        <Text size="sm" c="dimmed">
          {conflicts.length} item{conflicts.length === 1 ? '' : 's'} already
          exist at the destination.
        </Text>

        <SegmentedControl
          value={policy}
          onChange={(v) => setPolicy(v as Policy)}
          data={POLICY_DATA}
        />

        <ScrollArea.Autosize mah={320}>
          <Stack gap="xs" pr="sm">
            {conflicts.map((f) => (
              <Group key={f.rel_path} justify="space-between" wrap="nowrap">
                <Text size="sm" truncate title={f.rel_path}>
                  {f.rel_path}
                </Text>
                <SegmentedControl
                  size="xs"
                  value={choiceFor(f.rel_path)}
                  onChange={(v) => setChoice(f.rel_path, v as Resolution)}
                  data={FILE_DATA}
                />
              </Group>
            ))}
          </Stack>
        </ScrollArea.Autosize>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={apply}>Apply</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
