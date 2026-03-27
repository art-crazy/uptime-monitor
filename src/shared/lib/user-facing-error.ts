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
