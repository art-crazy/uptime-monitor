import { z } from 'zod'

const checkIntervalSchema = z.union([
  z.literal(30),
  z.literal(60),
  z.literal(300),
  z.literal(900),
])

export const apiMonitorMethodSchema = z.enum(['GET', 'POST'])
export const apiMonitorHeaderSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
})
export const apiMonitorAuthTypeSchema = z.enum(['none', 'bearer', 'basic'])
export const apiMonitorResponseModeSchema = z.enum(['none', 'body_includes', 'json_value'])

export const DEFAULT_API_MONITOR_CONFIG: {
  authPassword: string
  authToken: string
  authType: 'none' | 'bearer' | 'basic'
  authUsername: string
  body: string
  headers: { name: string; value: string }[]
  method: 'GET' | 'POST'
  responseBody: string
  responseJsonPath: string
  responseJsonValue: string
  responseMode: 'none' | 'body_includes' | 'json_value'
} = {
  authPassword: '',
  authToken: '',
  authType: 'none',
  authUsername: '',
  body: '',
  headers: [],
  method: 'GET',
  responseBody: '',
  responseJsonPath: '',
  responseJsonValue: '',
  responseMode: 'none',
}

export const apiMonitorConfigSchema = z.object({
  authPassword: z.string().default(DEFAULT_API_MONITOR_CONFIG.authPassword),
  authToken: z.string().default(DEFAULT_API_MONITOR_CONFIG.authToken),
  authType: apiMonitorAuthTypeSchema.default(DEFAULT_API_MONITOR_CONFIG.authType),
  authUsername: z.string().default(DEFAULT_API_MONITOR_CONFIG.authUsername),
  body: z.string().default(DEFAULT_API_MONITOR_CONFIG.body),
  headers: z.array(apiMonitorHeaderSchema).default(DEFAULT_API_MONITOR_CONFIG.headers),
  method: apiMonitorMethodSchema.default(DEFAULT_API_MONITOR_CONFIG.method),
  responseBody: z.string().default(DEFAULT_API_MONITOR_CONFIG.responseBody),
  responseJsonPath: z.string().default(DEFAULT_API_MONITOR_CONFIG.responseJsonPath),
  responseJsonValue: z.string().default(DEFAULT_API_MONITOR_CONFIG.responseJsonValue),
  responseMode: apiMonitorResponseModeSchema.default(DEFAULT_API_MONITOR_CONFIG.responseMode),
}).default(DEFAULT_API_MONITOR_CONFIG)

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
  apiConfig: apiMonitorConfigSchema,
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
export type ApiMonitorMethod = z.infer<typeof apiMonitorMethodSchema>
export type ApiMonitorHeader = z.infer<typeof apiMonitorHeaderSchema>
export type ApiMonitorAuthType = z.infer<typeof apiMonitorAuthTypeSchema>
export type ApiMonitorResponseMode = z.infer<typeof apiMonitorResponseModeSchema>
export type ApiMonitorConfig = z.infer<typeof apiMonitorConfigSchema>
export type Monitor = z.infer<typeof monitorSchema>
