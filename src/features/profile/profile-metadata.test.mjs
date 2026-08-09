import assert from 'node:assert/strict';
import test from 'node:test';

import { getRegistrationPhone } from './profile-metadata.ts';

test('solo acepta un teléfono de registro válido desde metadata', () => {
  assert.equal(getRegistrationPhone({ phone: '  +51 999 111 222  ' }), '+51 999 111 222');
  assert.equal(getRegistrationPhone({ phone: 'valor-inválido' }), null);
  assert.equal(getRegistrationPhone({ phone: 999111222 }), null);
  assert.equal(getRegistrationPhone(null), null);
});
