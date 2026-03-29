import { z } from 'zod'

export const telegramNotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  chatId: z.string(),
  sendRecovery: z.boolean(),
})

export const notificationSettingsSchema = z.object({
  telegram: telegramNotificationSettingsSchema,
})

export const settingsSchema = z.object({
  notifications: notificationSettingsSchema,
  defaultInterval: z.union([
    z.literal(30),
    z.literal(60),
    z.literal(300),
    z.literal(900),
  ]),
  pingUrl: z.string().min(1),
})

export type Settings = z.infer<typeof settingsSchema>
export type TelegramNotificationSettings = z.infer<typeof telegramNotificationSettingsSchema>
