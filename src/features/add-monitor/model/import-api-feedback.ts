import { t } from '@shared/lib/i18n'

import type {
  ApiImportErrorReason,
  ApiImportWarning,
} from './types'
import {
  API_IMPORT_ERROR_REASONS,
} from './types'

export function getApiImportErrorMessage(reason: ApiImportErrorReason): string {
  return reason === API_IMPORT_ERROR_REASONS.empty
    ? t('add_monitor_import_api_empty_error')
    : t('add_monitor_import_api_error')
}

export function getApiImportSuccessMessage(warnings: ApiImportWarning[]): string {
  return warnings.length > 0
    ? t('add_monitor_import_api_partial')
    : t('add_monitor_import_api_success')
}
