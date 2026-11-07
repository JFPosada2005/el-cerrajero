export const DEFAULT_LIMITS = { maxSteps: 5000, maxConfigs: 20000, maxStack: 64, maxFrames: 2000 };
export function withLimits(partial = {}) {
  return { ...DEFAULT_LIMITS, ...partial };
}
