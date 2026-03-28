import type { ApiImportFormState } from '../model/types'

export interface ApiImportStateHandlers {
  setApiAuthPassword: (value: string) => void
  setApiAuthToken: (value: string) => void
  setApiAuthType: (value: ApiImportFormState['authType']) => void
  setApiAuthUsername: (value: string) => void
  setApiBody: (value: string) => void
  setApiExpectedStatus: (value: string) => void
  setApiHeadersText: (value: string) => void
  setApiMethod: (value: ApiImportFormState['method']) => void
  setApiResponseBody: (value: string) => void
  setApiResponseJsonPath: (value: string) => void
  setApiResponseJsonValue: (value: string) => void
  setApiResponseMode: (value: ApiImportFormState['responseMode']) => void
  setUrl: (value: string) => void
}

export function applyApiImportState(
  state: ApiImportFormState,
  handlers: ApiImportStateHandlers,
): void {
  handlers.setUrl(state.url)
  handlers.setApiMethod(state.method)
  handlers.setApiHeadersText(state.headersText)
  handlers.setApiAuthType(state.authType)
  handlers.setApiAuthToken(state.authToken)
  handlers.setApiAuthUsername(state.authUsername)
  handlers.setApiAuthPassword(state.authPassword)
  handlers.setApiBody(state.body)
  handlers.setApiExpectedStatus(state.expectedStatus)
  handlers.setApiResponseMode(state.responseMode)
  handlers.setApiResponseBody(state.responseBody)
  handlers.setApiResponseJsonPath(state.responseJsonPath)
  handlers.setApiResponseJsonValue(state.responseJsonValue)
}
