// #187 — Client request queue for sequential API calls

type QueuedRequest = {
  execute: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (error: unknown) => void
}

const queues = new Map<string, QueuedRequest[]>()
const processing = new Set<string>()

async function processQueue(queueKey: string) {
  if (processing.has(queueKey)) return
  processing.add(queueKey)

  const queue = queues.get(queueKey)
  while (queue && queue.length > 0) {
    const request = queue.shift()
    if (!request) break

    try {
      const result = await request.execute()
      request.resolve(result)
    } catch (error) {
      request.reject(error)
    }
  }

  processing.delete(queueKey)
  if (queue?.length === 0) {
    queues.delete(queueKey)
  }
}

export function enqueueRequest<T>(
  queueKey: string,
  execute: () => Promise<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (!queues.has(queueKey)) {
      queues.set(queueKey, [])
    }
    queues.get(queueKey)!.push({
      execute: execute as () => Promise<unknown>,
      resolve: resolve as (value: unknown) => void,
      reject,
    })
    void processQueue(queueKey)
  })
}
