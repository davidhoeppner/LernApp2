// Gating evaluator stubs (Req 7.1, 7.3, 7.4)
export function evaluateSectionReadable(sectionProgress) {
  if (!sectionProgress) return false;
  return sectionProgress.readRatio >= 0.85 || !!sectionProgress.manuallyMarked;
}

export function evaluateMicroQuizStart(sectionProgress, featureEnabled) {
  const allowed = featureEnabled
    ? evaluateSectionReadable(sectionProgress)
    : true;
  const reasons = allowed ? [] : ['SECTION_UNREAD'];
  return { allowed, reasons };
}

export function deriveUnmetCriteria(moduleState) {
  const unmet = [];
  if (moduleState?.requiredSections) {
    moduleState.requiredSections.forEach(sec => {
      if (!evaluateSectionReadable(moduleState.sectionProgress?.[sec])) {
        unmet.push({ code: 'SECTION_UNREAD', id: sec });
      }
    });
  }
  if (moduleState?.microQuizzes) {
    moduleState.microQuizzes.forEach(mq => {
      if (!moduleState.microQuizState?.[mq]?.passed) {
        unmet.push({ code: 'MICRO_NOT_PASSED', id: mq });
      }
    });
  }
  return unmet;
}

export function evaluateFinalExamUnlock(moduleState) {
  if (!moduleState) return { status: 'LOCKED', unmetCriteria: [] };
  const unmet = deriveUnmetCriteria(moduleState);

  // Outdated check: detect module structure changes after last pass
  if (
    moduleState.finalExamPassed &&
    moduleState.structureSignature !== moduleState.lastPassedSignature
  ) {
    return { status: 'OUTDATED', unmetCriteria: unmet };
  }

  // Cooldown support (placeholder): if moduleState.cooldownUntil in future -> COOLDOWN
  if (
    moduleState.cooldownUntil &&
    new Date(moduleState.cooldownUntil) > new Date()
  ) {
    return { status: 'COOLDOWN', unmetCriteria: unmet };
  }

  if (unmet.length === 0) {
    return {
      status: moduleState.finalExamPassed ? 'PASSED' : 'READY',
      unmetCriteria: [],
    };
  }
  return { status: 'LOCKED', unmetCriteria: unmet };
}
