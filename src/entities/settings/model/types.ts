import { z } from 'zod'

export const settingsSchema = z.object({
  notificationsEnabled: z.boolean(),
  defaultInterval: z.union([
    z.literal(30),
    z.literal(60),
    z.literal(300),
    z.literal(900),
  ]),
  pingUrl: z.string().min(1),
})

export type Settings = z.infer<typeof settingsSchema>
