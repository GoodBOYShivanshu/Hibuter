import test from 'node:test';
import assert from 'node:assert/strict';
import { localDay, phase, openDispatch } from './model.mjs';
const entry = { date: '2026-11-21', prediction: 'Rain' };
test('local calendar date preserves the local day', () => assert.equal(localDay(new Date(2026, 10, 21, 23, 59)), '2026-11-21'));
test('dispatch opens on or after the scheduled day', () => {
  assert.equal(phase(entry, '2026-11-20'), 'sealed');
  assert.equal(phase(entry, '2026-11-21'), 'ready');
  assert.equal(phase(entry, '2026-11-22'), 'ready');
});
test('only a nonblank observation can reveal a due dispatch', () => {
  assert.throws(() => openDispatch(entry, 'Sunny', '2026-11-20'));
  assert.throws(() => openDispatch(entry, '  ', '2026-11-21'));
  const opened = openDispatch(entry, ' Sunny ', '2026-11-21');
  assert.deepEqual(opened, { ...entry, observation: 'Sunny' });
  assert.equal(phase(opened, '2026-11-21'), 'opened');
  assert.throws(() => openDispatch(opened, 'Rain', '2026-11-22'));
});
