import { RESPONSE_THRESHOLDS } from '../constants'

export type ResponseTone = 'good' | 'slow' | 'down'

export function getResponseTone(responseTime: number | null): ResponseTone {
  if (responseTime === null) {
    return 'down'
  }

  if (responseTime < RESPONSE_THRESHOLDS.good) {
    return 'good'
  }

  if (responseTime <= RESPONSE_THRESHOLDS.slow) {
    return 'slow'
  }

  return 'down'
}
