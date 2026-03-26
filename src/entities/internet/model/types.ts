import { z } from 'zod'

export const internetStatusSchema = z.object({
  online: z.boolean(),
  pingMs: z.number().int().nonnegative().nullable(),
  lastChecked: z.number().int().nonnegative(),
})

export type InternetStatus = z.infer<typeof internetStatusSchema>
