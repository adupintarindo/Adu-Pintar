type LogLevel = "debug" | "info" | "warn" | "error"

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const VALID_LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"]

const rawLevel = process.env.LOG_LEVEL
const currentLevel: LogLevel = rawLevel && VALID_LOG_LEVELS.includes(rawLevel as LogLevel)
  ? (rawLevel as LogLevel)
  : "info"

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel]
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (shouldLog("debug")) console.debug("[debug]", ...args)
  },
  info: (...args: unknown[]) => {
    if (shouldLog("info")) console.log("[info]", ...args)
  },
  warn: (...args: unknown[]) => {
    if (shouldLog("warn")) console.warn("[warn]", ...args)
  },
  error: (...args: unknown[]) => {
    if (shouldLog("error")) console.error("[error]", ...args)
  },
}
