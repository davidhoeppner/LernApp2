export default function AttemptHistoryDrawer(container, attempts = []) {
  const root = document.createElement('div');
  root.className = 'attempt-history-drawer';
  const title = document.createElement('h3');
  title.textContent = 'Attempt History';
  root.appendChild(title);
  const list = document.createElement('ul');
  attempts.forEach(a => {
    const li = document.createElement('li');
    li.textContent = `${a.date || ''} — ${a.quizId} — ${a.score || 'n/a'}`;
    list.appendChild(li);
  });
  root.appendChild(list);
  container.appendChild(root);
  return root;
}
