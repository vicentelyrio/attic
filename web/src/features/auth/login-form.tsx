import { useState } from 'react'

import { useNavigate } from '@tanstack/react-router'

import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Divider,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'

import {
  BracketsCurlyIcon,
  LockIcon,
  UserIcon,
} from '@phosphor-icons/react'

import { HttpError, useLogin } from '@domain'

import { AuthShell } from './auth-shell'
import classes from './auth.module.css'

export function LoginForm() {
  const navigate = useNavigate()
  const loginMut = useLogin()
  const [visible, setVisible] = useState(false)
  const [forgotOpen, forgot] = useDisclosure(false)

  const form = useForm({
    initialValues: { username: '', password: '', remember: true },
    validate: {
      username: (v) => (v.trim().length > 0 ? null : 'Required'),
      password: (v) => (v.length > 0 ? null : 'Required'),
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
    } catch {
      // Surfaced via loginMut.error below.
    }
  })

  const error =
    loginMut.error instanceof HttpError
      ? loginMut.error.message
      : loginMut.isError
        ? 'Something went wrong'
        : null

  return (
    <AuthShell title="Sign in to Vault" subtitle="Self-hosted · your files, on your server">
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

          <TextInput
            size="md"
            type={visible ? 'text' : 'password'}
            placeholder="Password"
            autoComplete="current-password"
            leftSection={<LockIcon size={16} />}
            rightSectionWidth={60}
            rightSection={
              <UnstyledButton
                type="button"
                className={classes.showToggle}
                onClick={() => setVisible((v) => !v)}
              >
                <Text size="sm">{visible ? 'Hide' : 'Show'}</Text>
              </UnstyledButton>
            }
            {...form.getInputProps('password')}
          />

          <Group justify="space-between">
            <Checkbox
              size="sm"
              label="Keep me signed in"
              {...form.getInputProps('remember', { type: 'checkbox' })}
            />
            <Anchor component="button" type="button" size="sm" onClick={forgot.open}>
              Forgot?
            </Anchor>
          </Group>

          <Button type="submit" size="md" fullWidth loading={loginMut.isPending}>
            Sign in
          </Button>

          <Divider label="OR" labelPosition="center" />

          <Button
            variant="default"
            size="md"
            fullWidth
            disabled
            leftSection={<BracketsCurlyIcon size={16} />}
          >
            Sign in with access token
          </Button>
        </Stack>
      </form>

      <Text size="sm" c="dimmed" ta="center">
        No account?{' '}
        <Anchor size="sm" onClick={() => navigate({ to: '/signup' })}>
          Create one
        </Anchor>
      </Text>

      <Modal opened={forgotOpen} onClose={forgot.close} title="Forgot your password?" centered>
        <Text size="sm" c="dimmed">
          Password resets are handled by your Vault administrator. Ask an owner or
          admin to reset it for you from the Accounts panel.
        </Text>
      </Modal>
    </AuthShell>
  )
}
