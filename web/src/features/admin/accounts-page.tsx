import { Alert, Box, Stack, Text, Title } from '@mantine/core'

import { AccountsTable } from './accounts-table'
import { useAccounts } from './hooks'
import { RemoveAccountModal } from './remove-account-modal'
import { ResetPasswordModal } from './reset-password-modal'

export function AccountsPage() {
  const state = useAccounts()
  const {
    pending,
    members,
    errorText,
    resetTarget,
    removeTarget,
    removePending,
    closeReset,
    closeRemove,
    submitReset,
    confirmRemove,
  } = state

  return (
    <Box style={{ overflow: 'auto', flex: 1 }} p="xl">
      <Stack gap="xl" maw={860}>
        <Stack gap={4}>
          <Title order={3}>Accounts</Title>
          <Text size="sm" c="dimmed">
            Approve new sign-ups and manage existing accounts.
          </Text>
        </Stack>

        {errorText && (
          <Alert color="red" variant="light" py="xs">
            {errorText}
          </Alert>
        )}

        {pending.length > 0 && (
          <AccountsTable
            title="Pending approval"
            rows={pending}
            state={state}
          />
        )}
        <AccountsTable title="Members" rows={members} state={state} />
      </Stack>

      <ResetPasswordModal
        user={resetTarget}
        onClose={closeReset}
        onSubmit={submitReset}
      />

      <RemoveAccountModal
        user={removeTarget}
        pending={removePending}
        onConfirm={confirmRemove}
        onClose={closeRemove}
      />
    </Box>
  )
}
