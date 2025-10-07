// Partial credit scoring utilities (Req 7.5)
export function multiSelectPartial({
  selected,
  correct,
  totalOptions,
  weight = 1,
}) {
  const correctSet = new Set(correct);
  let correctSelected = 0;
  let incorrectSelected = 0;
  selected.forEach(opt => {
    if (correctSet.has(opt)) correctSelected++;
    else incorrectSelected++;
  });
  const totalCorrect = correctSet.size;
  const totalOptionsNonCorrect = totalOptions - totalCorrect;
  const raw =
    correctSelected / totalCorrect -
    incorrectSelected / (totalOptionsNonCorrect || 1);
  const partial = Math.max(0, Math.min(1, raw));
  return partial * weight;
}

export function roundHalfUp(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor; // half-up for positive decimals
}
