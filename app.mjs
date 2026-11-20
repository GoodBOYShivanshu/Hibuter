import { localDay, phase, openDispatch } from './model.mjs';
const key = 'elsewhen-v1';
const form = document.querySelector('#dispatch');
const list = document.querySelector('#entries');
const status = document.querySelector('#status');
let entries = [];
try { entries = JSON.parse(localStorage.getItem(key) ?? '[]'); if (!Array.isArray(entries)) throw new Error(); }
catch { entries = []; status.textContent = 'The archive could not be loaded. Reload before adding dispatches.'; form.querySelector('button').disabled = true; }
function commit(next) {
  try { localStorage.setItem(key, JSON.stringify(next)); }
  catch { status.textContent = 'Could not save. Check your browser storage settings and try again.'; return false; }
  entries = next; status.textContent = ''; render(); return true;
}
function node(tag, text, className) {
  const el = document.createElement(tag); if (text) el.textContent = text; if (className) el.className = className; return el;
}
function render() {
  const today = localDay();
  form.elements.date.min = today;
  list.replaceChildren();
  document.querySelector('#count').textContent = String(entries.length).padStart(2, '0');
  if (!entries.length) list.append(node('p', 'Nothing in orbit yet. Your first dispatch will appear here.', 'empty'));
  for (const entry of entries) {
    const state = phase(entry, today);
    const card = node('article', '', 'entry');
    card.append(node('p', `${state.toUpperCase()} / ${entry.date}`, 'eyebrow'), node('h3', entry.title));
    if (state === 'sealed') card.append(node('p', 'Come back on or after the check-in date.'));
    if (state === 'ready') {
      const reply = node('form');
      const label = node('label', 'What actually happened?');
      const field = node('textarea'); field.required = true; field.maxLength = 1500;
      label.append(field); reply.append(label, node('button', 'Record & reveal →', 'button'));
      reply.addEventListener('submit', event => {
        event.preventDefault();
        try { const opened = openDispatch(entry, field.value); if (commit(entries.map(item => item.id === entry.id ? opened : item))) status.textContent = 'Dispatch opened.'; }
        catch (error) { status.textContent = error.message; }
      });
      card.append(reply);
    }
    if (state === 'opened') {
      const comparison = node('div', '', 'comparison');
      for (const [label, text] of [['Prediction', entry.prediction], ['Observation', entry.observation]]) {
        const block = node('div'); block.append(node('strong', label), node('p', text)); comparison.append(block);
      }
      card.append(comparison);
    }
    const remove = node('button', 'Delete dispatch', 'delete');
    remove.addEventListener('click', () => { if (confirm(`Delete “${entry.title}”?`)) commit(entries.filter(item => item.id !== entry.id)); });
    card.append(remove); list.append(card);
  }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const input = new FormData(form);
  const title = input.get('title').trim(), prediction = input.get('prediction').trim(), date = input.get('date');
  if (!title || !prediction || !date || date < localDay()) { status.textContent = 'Enter a subject, prediction, and a check-in date of today or later.'; return; }
  const entry = { id: crypto.randomUUID(), title, prediction, date };
  if (commit([entry, ...entries])) { form.reset(); status.textContent = 'Dispatch sealed.'; }
});
let renderedDay = localDay();
setInterval(() => { const today = localDay(); if (today !== renderedDay) { renderedDay = today; render(); } }, 30000);
render();
