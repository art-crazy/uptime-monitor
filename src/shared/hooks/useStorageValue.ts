import { useEffect, useState } from 'react'
import type { z } from 'zod'

import {
  getStorageValue,
  parseStorageChangeValue,
  subscribeToStorageKeys,
} from '../lib/storage'

export function useStorageValue<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): { isLoaded: boolean; value: T } {
  const [value, setValue] = useState<T>(fallback)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let active = true

    const loadValue = async () => {
      const nextValue = await getStorageValue(key, schema, fallback)

      if (active) {
        setValue(nextValue)
        setIsLoaded(true)
      }
    }

    void loadValue()

    const unsubscribe = subscribeToStorageKeys([key], (changes) => {
      const nextValue = parseStorageChangeValue(changes[key], schema)

      if (nextValue !== null && active) {
        setValue(nextValue)
        setIsLoaded(true)
        return
      }

      void loadValue()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [fallback, key, schema])

  return {
    isLoaded,
    value,
  }
}
