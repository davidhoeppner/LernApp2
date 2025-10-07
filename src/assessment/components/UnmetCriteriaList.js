export default function UnmetCriteriaList(container, unmet) {
  const ul = document.createElement('ul');
  ul.className = 'unmet-criteria-list';
  unmet.forEach(c => {
    const li = document.createElement('li');
    li.textContent = `${c.code} - ${c.id}`;
    ul.appendChild(li);
  });
  container.appendChild(ul);
  return ul;
}
