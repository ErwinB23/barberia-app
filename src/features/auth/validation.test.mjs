import assert from 'node:assert/strict';
import test from 'node:test';

import { getAuthErrorMessage } from './auth-errors.ts';
import {
  normalizeRecoveryRequestInput,
  normalizeLoginInput,
  normalizeRegisterInput,
  validateNewPasswordForm,
  validateRecoveryRequestForm,
  validateLoginForm,
  validateRegisterForm,
} from './validation.ts';
import { RECOVERY_REQUEST_SUCCESS_MESSAGE, requiresEmailConfirmation } from './auth-flow.ts';

test('normaliza el correo y los datos de registro antes de enviarlos', () => {
  assert.deepEqual(normalizeLoginInput({ email: '  USER@Example.COM ', password: 'secret123' }), {
    email: 'user@example.com',
    password: 'secret123',
  });

  assert.deepEqual(
    normalizeRegisterInput({
      fullName: '  Ana   Pérez  ',
      phone: '  +51 999 111 222  ',
      email: ' ANA@EXAMPLE.COM ',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    }),
    {
      fullName: 'Ana Pérez',
      phone: '+51 999 111 222',
      email: 'ana@example.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    },
  );
});

test('rechaza credenciales de acceso incompletas o con correo inválido', () => {
  assert.deepEqual(validateLoginForm({ email: 'correo-invalido', password: '' }), {
    email: 'Ingresa un correo electrónico válido.',
    password: 'Ingresa tu contraseña.',
  });
});

test('rechaza un registro con datos inválidos y contraseñas diferentes', () => {
  const errors = validateRegisterForm({
    fullName: 'A',
    phone: 'abc',
    email: 'correo-invalido',
    password: '1234567',
    passwordConfirmation: 'otra-clave',
  });

  assert.equal(errors.fullName, 'El nombre debe tener entre 2 y 120 caracteres.');
  assert.equal(errors.phone, 'Ingresa un teléfono válido de entre 7 y 30 caracteres.');
  assert.equal(errors.email, 'Ingresa un correo electrónico válido.');
  assert.equal(errors.password, 'La contraseña debe tener al menos 8 caracteres.');
  assert.equal(errors.passwordConfirmation, 'Las contraseñas no coinciden.');
});

test('acepta un registro válido', () => {
  assert.deepEqual(
    validateRegisterForm({
      fullName: 'Ana Pérez',
      phone: '+51 999 111 222',
      email: 'ana@example.com',
      password: 'secret123',
      passwordConfirmation: 'secret123',
    }),
    {},
  );
});

test('valida y normaliza el correo de recuperación sin exigir contraseña', () => {
  assert.deepEqual(normalizeRecoveryRequestInput({ email: '  ANA@EXAMPLE.COM ' }), {
    email: 'ana@example.com',
  });
  assert.deepEqual(validateRecoveryRequestForm({ email: 'correo-invalido' }), {
    email: 'Ingresa un correo electrónico válido.',
  });
  assert.deepEqual(validateRecoveryRequestForm({ email: 'ana@example.com' }), {});
});

test('valida la nueva contraseña y su confirmación', () => {
  assert.deepEqual(
    validateNewPasswordForm({ password: '1234567', passwordConfirmation: 'otra-clave' }),
    {
      password: 'La contraseña debe tener al menos 8 caracteres.',
      passwordConfirmation: 'Las contraseñas no coinciden.',
    },
  );
  assert.deepEqual(
    validateNewPasswordForm({ password: 'secret123', passwordConfirmation: 'secret123' }),
    {},
  );
});

test('solo solicita confirmar email cuando signup no entrega sesión', () => {
  assert.equal(requiresEmailConfirmation(null), true);
  assert.equal(requiresEmailConfirmation({ access_token: 'present' }), false);
});

test('la solicitud de recuperación usa siempre un estado de éxito no enumerable', () => {
  assert.equal(
    RECOVERY_REQUEST_SUCCESS_MESSAGE,
    'Si existe una cuenta asociada, recibirás un enlace para restablecer tu contraseña.',
  );
  assert.equal(RECOVERY_REQUEST_SUCCESS_MESSAGE.includes('no existe'), false);
});

test('traduce errores conocidos sin exponer mensajes internos', () => {
  assert.equal(
    getAuthErrorMessage({ code: 'invalid_credentials' }),
    'El correo o la contraseña no son correctos.',
  );
  assert.equal(
    getAuthErrorMessage(new Error('backend details')),
    'No pudimos completar la operación. Inténtalo nuevamente.',
  );
});
