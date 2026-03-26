let backgroundTaskQueue = Promise.resolve()

export function enqueueBackgroundTask<T>(task: () => Promise<T>): Promise<T> {
  const nextTask = backgroundTaskQueue.catch(() => undefined).then(task)

  backgroundTaskQueue = nextTask.then(
    () => undefined,
    () => undefined,
  )

  return nextTask
}
