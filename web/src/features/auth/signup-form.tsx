import { useNavigate } from '@tanstack/react-router'

import {
  Alert,
  Anchor,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'

import { CheckCircleIcon, LockIcon, UserIcon } from '@phosphor-icons/react'

import { HttpError, useRegister } from '@domain'

import { AuthShell } from './auth-shell'

export function SignupForm() {
  const navigate = useNavigate()
  const registerMut = useRegister()

  const form = useForm({
    initialValues: { username: '', password: '', confirm: '' },
    validate: {
      username: (v) => v.trim().length >= 3 ? null : 'At least 3 characters',
      password: (v) => (v.length >= 8 ? null : 'At least 8 characters'),
      confirm: (v, values) => v === values.password ? null : 'Passwords do not match',
    },
  })

  const submit = form.onSubmit(async (values) => {
    try {
      await registerMut.mutateAsync({
        username: values.username.trim(),
        password: values.password,
      })
    }
    catch {}
  })

  const error =
    registerMut.error instanceof HttpError
      ? registerMut.error.message
      : registerMut.isError
        ? 'Something went wrong'
        : null

  if (registerMut.isSuccess) {
    return (
      <AuthShell title="Account created" subtitle="One more step">
        <Alert
          color="green"
          variant="light"
          icon={<CheckCircleIcon size={18} />}
          title="Waiting for approval"
        >
          Your account has been created and is pending approval. An administrator
          needs to approve it before you can sign in.
        </Alert>
        <Button variant="default" fullWidth onClick={() => navigate({ to: '/login' })}>
          Back to sign in
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create your account" subtitle="Self-hosted · your files, on your server">
      <form onSubmit={submit}>
        <Stack gap="md">
          {error && (
            <Alert color="red" variant="light" py="xs">
              {error}
            </Alert>
          )}

          <TextInput
            size="md"
            placeholder="Username"
            autoComplete="username"
            leftSection={<UserIcon size={16} />}
            {...form.getInputProps('username')}
          />
          <PasswordInput
            size="md"
            placeholder="Password"
            autoComplete="new-password"
            leftSection={<LockIcon size={16} />}
            {...form.getInputProps('password')}
          />
          <PasswordInput
            size="md"
            placeholder="Confirm password"
            autoComplete="new-password"
            leftSection={<LockIcon size={16} />}
            {...form.getInputProps('confirm')}
          />

          <Button type="submit" size="md" fullWidth loading={registerMut.isPending}>
            Create account
          </Button>
        </Stack>
      </form>

      <Text size="sm" c="dimmed" ta="center">
        Already have an account?{' '}
        <Anchor size="sm" onClick={() => navigate({ to: '/login' })}>
          Sign in
        </Anchor>
      </Text>
    </AuthShell>
  )
}
