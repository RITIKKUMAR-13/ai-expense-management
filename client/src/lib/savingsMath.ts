/** Exact paise-based progress math shared by the Savings Goals display and contract tests. */
export function getSavingsProgress(targetPaise: number, savedPaise: number, status: string) {
  const safeTarget = Math.max(1, targetPaise);
  const complete = status === "completed" || savedPaise >= safeTarget;
  return {
    complete,
    percent: Math.min(100, Math.round((savedPaise / safeTarget) * 100)),
    remainingPaise: Math.max(0, safeTarget - savedPaise),
  };
}
