import { useEffect, useState } from 'react'
import type { z } from 'zod'

import {
  getStorageValue,
  parseStorageChangeValue,
  subscribeToStorageKeys,
} from '../lib/storage'

interface StorageState<T> {
  isLoaded: boolean
  value: T
}

export function useStorageValue<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): { isLoaded: boolean; value: T } {
  const [state, setState] = useState<StorageState<T>>({ isLoaded: false, value: fallback })

  useEffect(() => {
    let active = true

    const loadValue = async () => {
      const nextValue = await getStorageValue(key, schema, fallback)

      if (active) {
        setState({ isLoaded: true, value: nextValue })
      }
    }

    void loadValue()

    const unsubscribe = subscribeToStorageKeys([key], (changes) => {
      const nextValue = parseStorageChangeValue(changes[key], schema)

      if (nextValue !== null && active) {
        setState({ isLoaded: true, value: nextValue })
        return
      }

      void loadValue()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [fallback, key, schema])

  return state
}
