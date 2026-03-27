import { z } from 'zod'

import type { MessageKey } from './i18n.generated'

export const localizedMessageSchema = z.object({
  key: z.string().min(1),
  substitutions: z.array(z.string()).default([]),
})

export type LocalizedMessage = z.infer<typeof localizedMessageSchema>

export function createLocalizedMessage(
  key: MessageKey,
  substitutions: readonly (number | string)[] = [],
): LocalizedMessage {
  return {
    key,
    substitutions: substitutions.map((value) => String(value)),
  }
}
