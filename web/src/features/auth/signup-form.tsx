import { useI18nContext } from '@i18n'
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
  const { LL } = useI18nContext()
  const navigate = useNavigate()
  const registerMut = useRegister()

  const form = useForm({
    initialValues: { username: '', password: '', confirm: '' },
    validate: {
      username: (v) => (v.trim().length >= 3 ? null : LL.auth.minUsername()),
      password: (v) => (v.length >= 8 ? null : LL.auth.minPassword()),
      confirm: (v, values) =>
        v === values.password ? null : LL.auth.passwordMismatch(),
    },
  })

  const submit = form.onSubmit(async (values) => {
    try {
      await registerMut.mutateAsync({
        username: values.username.trim(),
        password: values.password,
      })
    } catch {}
  })

  const error =
    registerMut.error instanceof HttpError
      ? registerMut.error.message
      : registerMut.isError
        ? LL.common.somethingWentWrong()
        : null

  if (registerMut.isSuccess) {
    return (
      <AuthShell
        title={LL.auth.createdTitle()}
        subtitle={LL.auth.createdSubtitle()}
      >
        <Alert
          color="green"
          variant="light"
          icon={<CheckCircleIcon size={18} />}
          title={LL.auth.pendingTitle()}
        >
          {LL.auth.pendingBody()}
        </Alert>
        <Button
          variant="default"
          fullWidth
          onClick={() => navigate({ to: '/login' })}
        >
          {LL.auth.backToSignIn()}
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={LL.auth.createTitle()} subtitle={LL.app.tagline()}>
      <form onSubmit={submit}>
        <Stack gap="md">
          {error && (
            <Alert color="red" variant="light" py="xs">
              {error}
            </Alert>
          )}

          <TextInput
            size="md"
            placeholder={LL.auth.username()}
            autoComplete="username"
            leftSection={<UserIcon size={16} />}
            {...form.getInputProps('username')}
          />
          <PasswordInput
            size="md"
            placeholder={LL.auth.password()}
            autoComplete="new-password"
            leftSection={<LockIcon size={16} />}
            {...form.getInputProps('password')}
          />
          <PasswordInput
            size="md"
            placeholder={LL.auth.confirmPassword()}
            autoComplete="new-password"
            leftSection={<LockIcon size={16} />}
            {...form.getInputProps('confirm')}
          />

          <Button
            type="submit"
            size="md"
            fullWidth
            loading={registerMut.isPending}
          >
            {LL.auth.createAccount()}
          </Button>
        </Stack>
      </form>

      <Text size="sm" c="dimmed" ta="center">
        {LL.auth.haveAccount()}{' '}
        <Anchor size="sm" onClick={() => navigate({ to: '/login' })}>
          {LL.auth.signIn()}
        </Anchor>
      </Text>
    </AuthShell>
  )
}
