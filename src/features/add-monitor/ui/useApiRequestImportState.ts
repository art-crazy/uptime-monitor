import { useState } from 'react'

export function useApiRequestImportState() {
  const [value, setValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => {
    setIsOpen((current) => !current)
  }

  const handleValueChange = (nextValue: string) => {
    setValue(nextValue)
  }

  return {
    handleToggle,
    handleValueChange,
    isOpen,
    setIsOpen,
    setValue,
    value,
  }
}
