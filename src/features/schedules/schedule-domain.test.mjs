import assert from 'node:assert/strict';
import test from 'node:test';

import {
  WEEKDAYS_MONDAY_FIRST,
  getWeekdayName,
  hasOverlappingIntervals,
  isTimeRangeValid,
  parseClosureForm,
  parseHourForm,
  sortHourIntervals,
} from './schedule-domain.ts';

test('convierte weekday a español y ordena la semana de lunes a domingo', () => {
  assert.deepEqual(WEEKDAYS_MONDAY_FIRST, [1, 2, 3, 4, 5, 6, 0]);
  assert.deepEqual(WEEKDAYS_MONDAY_FIRST.map(getWeekdayName), [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
  ]);
});

test('acepta únicamente horas HH:mm cuyo inicio sea anterior al fin', () => {
  assert.equal(isTimeRangeValid('09:00', '13:00'), true);
  assert.equal(isTimeRangeValid('13:00', '13:00'), false);
  assert.equal(isTimeRangeValid('14:00', '13:00'), false);
  assert.equal(isTimeRangeValid('24:00', '25:00'), false);
  assert.equal(isTimeRangeValid('', '13:00'), false);
});

test('detecta solapamientos y permite intervalos adyacentes', () => {
  const intervals = [
    { id: 'morning', startTime: '09:00', endTime: '13:00' },
    { id: 'afternoon', startTime: '14:30', endTime: '22:00' },
  ];

  assert.equal(hasOverlappingIntervals({ startTime: '12:30', endTime: '14:00' }, intervals), true);
  assert.equal(hasOverlappingIntervals({ startTime: '13:00', endTime: '14:30' }, intervals), false);
  assert.equal(
    hasOverlappingIntervals({ startTime: '12:00', endTime: '15:00' }, intervals, 'morning'),
    true,
  );
  assert.equal(
    hasOverlappingIntervals({ startTime: '10:00', endTime: '12:00' }, intervals, 'morning'),
    false,
  );
});

test('ordena intervalos por hora de inicio y luego por hora de fin', () => {
  const sorted = sortHourIntervals([
    { id: 'late', startTime: '14:30', endTime: '22:00' },
    { id: 'long', startTime: '09:00', endTime: '13:00' },
    { id: 'short', startTime: '09:00', endTime: '12:00' },
  ]);

  assert.deepEqual(
    sorted.map((interval) => interval.id),
    ['short', 'long', 'late'],
  );
});

test('valida intervalos vacíos y solapados antes de guardarlos', () => {
  const existing = [{ id: 'morning', startTime: '09:00', endTime: '13:00' }];
  const empty = parseHourForm({ startTime: '', endTime: '' }, existing);
  const overlapping = parseHourForm({ startTime: '12:00', endTime: '14:00' }, existing);
  const adjacent = parseHourForm({ startTime: '13:00', endTime: '14:00' }, existing);

  assert.equal(empty.values, null);
  assert.ok(empty.errors.startTime);
  assert.ok(empty.errors.endTime);
  assert.equal(overlapping.values, null);
  assert.equal(
    overlapping.errors.endTime,
    'Este intervalo se superpone con otro horario del mismo día.',
  );
  assert.deepEqual(adjacent, {
    values: { startTime: '13:00', endTime: '14:00' },
    errors: {},
  });
});

test('valida el cierre y convierte la hora de Lima a timestamptz', () => {
  const valid = parseClosureForm({
    startDate: '2026-08-10',
    startTime: '09:00',
    endDate: '2026-08-10',
    endTime: '13:30',
    reason: '  Mantenimiento interno  ',
  });
  const invalid = parseClosureForm({
    startDate: '2026-08-10',
    startTime: '13:30',
    endDate: '2026-08-10',
    endTime: '09:00',
    reason: '',
  });

  assert.deepEqual(valid.values, {
    startsAt: '2026-08-10T14:00:00.000Z',
    endsAt: '2026-08-10T18:30:00.000Z',
    reason: 'Mantenimiento interno',
  });
  assert.deepEqual(valid.errors, {});
  assert.equal(invalid.values, null);
  assert.equal(invalid.errors.endTime, 'El cierre debe terminar después de comenzar.');
});
