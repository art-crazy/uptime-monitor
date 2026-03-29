import { useState } from 'react'

export function useApiRequestImportState() {
  const [value, setValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const resetInlineFeedback = () => {
    setError('')
    setMessage('')
  }

  const handleToggle = () => {
    resetInlineFeedback()
    setIsOpen((current) => !current)
  }

  const handleValueChange = (nextValue: string) => {
    setError('')
    setMessage('')
    setValue(nextValue)
  }

  return {
    error,
    handleToggle,
    handleValueChange,
    isOpen,
    message,
    resetInlineFeedback,
    setError,
    setIsOpen,
    setMessage,
    setValue,
    value,
  }
}
