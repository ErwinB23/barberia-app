import assert from 'node:assert/strict';
import test from 'node:test';

const pressFeedbackModule = await import('./press-feedback.ts').catch(() => null);

test('omite transform cuando el control no está presionado', () => {
  assert.ok(pressFeedbackModule, 'Falta el generador Android-safe de feedback pressed');
  assert.equal(pressFeedbackModule.getPressedScaleStyle(false, false, 0.98), null);
});

test('produce un array transform válido al presionar', () => {
  assert.ok(pressFeedbackModule, 'Falta el generador Android-safe de feedback pressed');
  assert.deepEqual(pressFeedbackModule.getPressedScaleStyle(true, false, 0.98), {
    transform: [{ scale: 0.98 }],
  });
});

test('omite transform cuando está activo reduced motion', () => {
  assert.ok(pressFeedbackModule, 'Falta el generador Android-safe de feedback pressed');
  assert.equal(pressFeedbackModule.getPressedScaleStyle(true, true, 0.98), null);
});

test('nunca serializa transform null para cards o botones', () => {
  assert.ok(pressFeedbackModule, 'Falta el generador Android-safe de feedback pressed');

  for (const scale of [0.94, 0.96, 0.985, 0.99]) {
    for (const pressed of [false, true]) {
      for (const reduceMotion of [false, true]) {
        const style = pressFeedbackModule.getPressedScaleStyle(pressed, reduceMotion, scale);
        assert.doesNotMatch(JSON.stringify(style), /"transform":null/);
      }
    }
  }
});
