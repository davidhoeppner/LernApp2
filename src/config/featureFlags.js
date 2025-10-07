// Feature flags configuration (Req 7.11)
export const featureFlags = {
  quizGating: true,
};

export function isFeatureEnabled(flag) {
  return !!featureFlags[flag];
}
