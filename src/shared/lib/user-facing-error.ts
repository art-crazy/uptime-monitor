export class UserFacingError extends Error {
  readonly isUserFacing = true

  constructor(message: string) {
    super(message)
    this.name = 'UserFacingError'
  }
}

export function isUserFacingError(error: unknown): error is UserFacingError {
  return error instanceof UserFacingError
    || (
      error instanceof Error
      && 'isUserFacing' in error
      && error.isUserFacing === true
    )
}

export function isIgnorableExtensionError(error: unknown): boolean {
  if (isUserFacingError(error)) {
    return true
  }

  if (!(error instanceof Error)) {
    return false
  }

  return [
    'No SW',
    'Extension context invalidated.',
    'The message port closed before a response was received.',
  ].includes(error.message)
    || error.message.includes('Receiving end does not exist')
}
