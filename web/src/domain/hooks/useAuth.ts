import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchMe,
  type LoginReq,
  login,
  logout,
  type RegisterReq,
  register,
} from '@domain'

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: fetchMe, retry: false })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: LoginReq) => login(req),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  })
}

export function useRegister() {
  return useMutation({ mutationFn: (req: RegisterReq) => register(req) })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => qc.setQueryData(['me'], null),
  })
}
