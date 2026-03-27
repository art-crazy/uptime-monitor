import { z } from 'zod'

import { MESSAGE_TYPES } from '../constants'

export const checkIntervalValueSchema = z.union([
  z.literal(30),
  z.literal(60),
  z.literal(300),
  z.literal(900),
])

export const runtimeMonitorTypeSchema = z.enum(['website', 'api', 'host'])
export const runtimeApiMonitorConfigSchema = z.object({
  authPassword: z.string(),
  authToken: z.string(),
  authType: z.enum(['none', 'bearer', 'basic']),
  authUsername: z.string(),
  body: z.string(),
  expectedStatus: z.number().int().min(100).max(599).nullable(),
  headers: z.array(
    z.object({
      name: z.string().min(1),
      value: z.string(),
    }),
  ),
  method: z.enum(['GET', 'POST']),
  responseBody: z.string(),
  responseJsonPath: z.string(),
  responseJsonValue: z.string(),
  responseMode: z.enum(['none', 'body_includes', 'json_value']),
})

export const saveMonitorDraftPayloadSchema = z.object({
  apiConfig: runtimeApiMonitorConfigSchema,
  id: z.string().min(1).optional(),
  interval: checkIntervalValueSchema,
  type: runtimeMonitorTypeSchema,
  url: z.string().min(1),
})

const checkNowMessageSchema = z.object({
  type: z.literal(MESSAGE_TYPES.checkNow),
  monitorId: z.string().min(1),
})

const saveMonitorMessageSchema = z.object({
  type: z.literal(MESSAGE_TYPES.saveMonitor),
  monitorDraft: saveMonitorDraftPayloadSchema,
})

const toggleMonitorMessageSchema = z.object({
  type: z.literal(MESSAGE_TYPES.toggleMonitor),
  monitorId: z.string().min(1),
})

const deleteMonitorMessageSchema = z.object({
  type: z.literal(MESSAGE_TYPES.deleteMonitor),
  monitorId: z.string().min(1),
})

const clearAllMonitoringDataMessageSchema = z.object({
  type: z.literal(MESSAGE_TYPES.clearAllMonitoringData),
})

const setNotificationsEnabledMessageSchema = z.object({
  type: z.literal(MESSAGE_TYPES.setNotificationsEnabled),
  enabled: z.boolean(),
})

const setDefaultCheckIntervalMessageSchema = z.object({
  type: z.literal(MESSAGE_TYPES.setDefaultCheckInterval),
  interval: checkIntervalValueSchema,
})

const setPingUrlMessageSchema = z.object({
  type: z.literal(MESSAGE_TYPES.setPingUrl),
  pingUrl: z.string().min(1),
})

export const runtimeMessageSchema = z.discriminatedUnion('type', [
  checkNowMessageSchema,
  saveMonitorMessageSchema,
  toggleMonitorMessageSchema,
  deleteMonitorMessageSchema,
  clearAllMonitoringDataMessageSchema,
  setNotificationsEnabledMessageSchema,
  setDefaultCheckIntervalMessageSchema,
  setPingUrlMessageSchema,
])

export type SaveMonitorDraftPayload = z.infer<typeof saveMonitorDraftPayloadSchema>
export type RuntimeCommand = z.infer<typeof runtimeMessageSchema>

export interface RuntimeCommandPayloadMap {
  [MESSAGE_TYPES.checkNow]: { monitorId: string }
  [MESSAGE_TYPES.saveMonitor]: { monitorDraft: SaveMonitorDraftPayload }
  [MESSAGE_TYPES.toggleMonitor]: { monitorId: string }
  [MESSAGE_TYPES.deleteMonitor]: { monitorId: string }
  [MESSAGE_TYPES.clearAllMonitoringData]: Record<string, never>
  [MESSAGE_TYPES.setNotificationsEnabled]: { enabled: boolean }
  [MESSAGE_TYPES.setDefaultCheckInterval]: {
    interval: z.infer<typeof checkIntervalValueSchema>
  }
  [MESSAGE_TYPES.setPingUrl]: { pingUrl: string }
}

export interface RuntimeCommandResponseMap {
  [MESSAGE_TYPES.checkNow]: void
  [MESSAGE_TYPES.saveMonitor]: { monitorId: string }
  [MESSAGE_TYPES.toggleMonitor]: void
  [MESSAGE_TYPES.deleteMonitor]: void
  [MESSAGE_TYPES.clearAllMonitoringData]: void
  [MESSAGE_TYPES.setNotificationsEnabled]: void
  [MESSAGE_TYPES.setDefaultCheckInterval]: void
  [MESSAGE_TYPES.setPingUrl]: void
}

export type RuntimeCommandType = keyof RuntimeCommandPayloadMap
