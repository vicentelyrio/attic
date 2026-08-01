import { useI18nContext } from '@i18n'
import { useNavigate } from '@tanstack/react-router'

import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Divider,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'

import { BracketsCurlyIcon, LockIcon, UserIcon } from '@phosphor-icons/react'

import { HttpError, useLogin } from '@domain'

import { AuthShell } from './auth-shell'

export function LoginForm() {
  const { LL } = useI18nContext()
  const navigate = useNavigate()
  const loginMut = useLogin()
  const [forgotOpen, forgot] = useDisclosure(false)

  const form = useForm({
    initialValues: { username: '', password: '', remember: true },
    validate: {
      username: (v) => (v.trim().length > 0 ? null : LL.common.required()),
      password: (v) => (v.length > 0 ? null : LL.common.required()),
    },
  })

  const submit = form.onSubmit(async (values) => {
    try {
      await loginMut.mutateAsync({
        username: values.username.trim(),
        password: values.password,
        remember: values.remember,
      })
      navigate({ to: '/' })
    } catch {}
  })

  const error =
    loginMut.error instanceof HttpError
      ? loginMut.error.message
      : loginMut.isError
        ? LL.common.somethingWentWrong()
        : null

  return (
    <AuthShell title={LL.auth.signIn()} subtitle={LL.app.tagline()}>
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
            autoComplete="current-password"
            leftSection={<LockIcon size={16} />}
            {...form.getInputProps('password')}
          />

          <Group justify="space-between">
            <Checkbox
              size="sm"
              label={LL.auth.keepSignedIn()}
              {...form.getInputProps('remember', { type: 'checkbox' })}
            />
            <Anchor
              component="button"
              type="button"
              size="sm"
              onClick={forgot.open}
            >
              {LL.auth.forgot()}
            </Anchor>
          </Group>

          <Button
            type="submit"
            size="md"
            fullWidth
            loading={loginMut.isPending}
          >
            {LL.auth.signIn()}
          </Button>

          <Divider label={LL.auth.or()} labelPosition="center" color="dark.5" />

          <Button
            variant="default"
            size="md"
            fullWidth
            disabled
            leftSection={<BracketsCurlyIcon size={16} />}
          >
            {LL.auth.signInWithToken()}
          </Button>
        </Stack>
      </form>

      <Text size="sm" c="dimmed" ta="center">
        {LL.auth.noAccount()}{' '}
        <Anchor size="sm" onClick={() => navigate({ to: '/signup' })}>
          {LL.auth.createOne()}
        </Anchor>
      </Text>

      <Modal
        opened={forgotOpen}
        onClose={forgot.close}
        title={LL.auth.forgotTitle()}
        centered
      >
        <Text size="sm" c="dimmed">
          {LL.auth.forgotBody()}
        </Text>
      </Modal>
    </AuthShell>
  )
}
