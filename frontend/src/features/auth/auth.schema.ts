import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido').max(254),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres').max(128),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').max(120),
  email: z.string().trim().email('Informe um e-mail válido').max(254),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres').max(128),
})

export type RegisterInput = z.infer<typeof registerSchema>
