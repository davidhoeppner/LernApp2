export default function ScoreBadge(score) {
  const span = document.createElement('span');
  span.className = 'score-badge';
  span.textContent = `${score}%`;
  if (score >= 70) span.classList.add('badge-pass');
  else span.classList.add('badge-fail');
  return span;
}
