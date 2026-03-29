import type {
  ApiImportFormState,
  ApiMonitorFormFields,
} from './types'

export interface ApiImportPatch {
  apiFields: ApiMonitorFormFields
  url: string
}

export function createApiImportPatch(state: ApiImportFormState): ApiImportPatch {
  const { url, ...apiFields } = state

  return {
    apiFields,
    url,
  }
}
