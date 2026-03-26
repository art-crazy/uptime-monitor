import { z } from 'zod'

const checkIntervalSchema = z.union([
  z.literal(30),
  z.literal(60),
  z.literal(300),
  z.literal(900),
])

export const monitorTypeSchema = z.preprocess(
  (value) => (value === 'ip' ? 'host' : value),
  z.enum(['website', 'api', 'host']),
)
export const monitorStatusSchema = z.enum(['online', 'down', 'paused', 'pending'])
export const monitorCheckStateSchema = z.enum(['idle', 'running']).default('idle')
export const historyEntrySchema = z.object({
  timestamp: z.number().int().nonnegative(),
  responseTime: z.number().int().nonnegative().nullable(),
  status: z.enum(['online', 'down']),
})

export const monitorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().min(1),
  type: monitorTypeSchema,
  interval: checkIntervalSchema,
  status: monitorStatusSchema,
  checkState: monitorCheckStateSchema,
  lastCheckError: z.string().nullable().default(null),
  lastChecked: z.number().int().nonnegative().nullable(),
  responseTime: z.number().int().nonnegative().nullable(),
  uptimePercent: z.number().min(0).max(100),
  incidentCount: z.number().int().nonnegative(),
  history: z.array(historyEntrySchema),
  checkVersion: z.number().int().nonnegative().default(0),
  createdAt: z.number().int().nonnegative(),
})

export const monitorsSchema = z.array(monitorSchema)

export type MonitorType = z.infer<typeof monitorTypeSchema>
export type MonitorStatus = z.infer<typeof monitorStatusSchema>
export type MonitorCheckState = z.infer<typeof monitorCheckStateSchema>
export type CheckInterval = z.infer<typeof checkIntervalSchema>
export type HistoryEntry = z.infer<typeof historyEntrySchema>
export type Monitor = z.infer<typeof monitorSchema>
