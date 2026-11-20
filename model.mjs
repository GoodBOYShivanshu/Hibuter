export function localDay(now = new Date()) {
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}
export function phase(entry, today = localDay()) {
  return entry.observation ? 'opened' : entry.date <= today ? 'ready' : 'sealed';
}
export function openDispatch(entry, observation, today = localDay()) {
  const text = observation.trim();
  if (phase(entry, today) !== 'ready' || !text || text.length > 1500) throw new Error('This dispatch cannot be opened with that observation.');
  return { ...entry, observation: text };
}
