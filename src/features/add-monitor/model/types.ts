import {
  type ApiMonitorAuthType,
  type ApiMonitorConfig,
  type ApiMonitorResponseMode,
  type CheckInterval,
  type MonitorType,
} from '../../../entities/monitor'

export interface MonitorFormDraft {
  apiConfig: ApiMonitorConfig
  id?: string
  interval: CheckInterval
  type: MonitorType
  url: string
}

export interface ApiMonitorFormFields {
  authPassword: string
  authToken: string
  authType: ApiMonitorAuthType
  authUsername: string
  body: string
  expectedStatus: string
  headersText: string
  method: ApiMonitorConfig['method']
  responseBody: string
  responseJsonPath: string
  responseJsonValue: string
  responseMode: ApiMonitorResponseMode
}
