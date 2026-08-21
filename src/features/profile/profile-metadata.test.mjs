import assert from 'node:assert/strict';
import test from 'node:test';

import { getRegistrationPhone } from './profile-metadata.ts';

const profileDomain = await import('./profile-domain.ts').catch(() => ({}));

test('solo acepta un teléfono de registro válido desde metadata', () => {
  assert.equal(getRegistrationPhone({ phone: '  +51 999 111 222  ' }), '+51 999 111 222');
  assert.equal(getRegistrationPhone({ phone: 'valor-inválido' }), null);
  assert.equal(getRegistrationPhone({ phone: 999111222 }), null);
  assert.equal(getRegistrationPhone(null), null);
});

test('valida y normaliza solamente los datos personales editables', () => {
  assert.equal(typeof profileDomain.parseProfileForm, 'function');
  if (typeof profileDomain.parseProfileForm !== 'function') return;

  assert.deepEqual(
    profileDomain.parseProfileForm({
      fullName: '  Ana   Pérez  ',
      phone: '  +51 999 111 222  ',
      avatarUrl: ' https://example.com/ana.jpg ',
    }),
    {
      values: {
        fullName: 'Ana Pérez',
        phone: '+51 999 111 222',
        avatarUrl: 'https://example.com/ana.jpg',
      },
      errors: {},
    },
  );

  assert.deepEqual(
    profileDomain.parseProfileForm({
      fullName: 'A',
      phone: 'abc',
      avatarUrl: 'http://example.com/photo.jpg',
    }).errors,
    {
      fullName: 'El nombre debe tener entre 2 y 120 caracteres.',
      phone: 'Ingresa un teléfono válido de entre 7 y 30 caracteres.',
      avatarUrl: 'Ingresa una URL HTTPS válida.',
    },
  );
});

test('una cuenta cliente no muestra una sección de espacios vacía', () => {
  assert.equal(typeof profileDomain.buildProfileSpaces, 'function');
  if (typeof profileDomain.buildProfileSpaces !== 'function') return;

  assert.deepEqual(profileDomain.buildProfileSpaces([]), []);
});

test('muestra el espacio operativo del barbero activo sin darle acceso administrativo', () => {
  assert.equal(typeof profileDomain.buildProfileSpaces, 'function');
  if (typeof profileDomain.buildProfileSpaces !== 'function') return;

  assert.deepEqual(
    profileDomain.buildProfileSpaces([
      {
        barbershopId: 'barbershop-a',
        barbershopName: 'Barbería Central',
        role: 'barber',
        ownBarberProfile: { barberId: 'barber-a', isActive: true },
      },
    ]),
    [
      {
        id: 'barber:barber-a',
        kind: 'barber',
        title: 'Mi espacio de barbero',
        description: 'Barbería Central',
        href: '/barbershops/barbershop-a/barbers/barber-a/home',
      },
    ],
  );
});

test('un administrador que también es barbero conserva ambos espacios', () => {
  assert.equal(typeof profileDomain.buildProfileSpaces, 'function');
  if (typeof profileDomain.buildProfileSpaces !== 'function') return;

  const spaces = profileDomain.buildProfileSpaces([
    {
      barbershopId: 'barbershop-a',
      barbershopName: 'Barbería Central',
      role: 'administrator',
      ownBarberProfile: { barberId: 'barber-a', isActive: true },
    },
  ]);

  assert.deepEqual(
    spaces.map(({ kind, title }) => ({ kind, title })),
    [
      { kind: 'barber', title: 'Mi espacio de barbero' },
      { kind: 'administrator', title: 'Administrar Barbería Central' },
    ],
  );
});

test('muestra por separado cada barbería administrada', () => {
  assert.equal(typeof profileDomain.buildProfileSpaces, 'function');
  if (typeof profileDomain.buildProfileSpaces !== 'function') return;

  const spaces = profileDomain.buildProfileSpaces([
    {
      barbershopId: 'barbershop-a',
      barbershopName: 'Barbería Central',
      role: 'administrator',
      ownBarberProfile: null,
    },
    {
      barbershopId: 'barbershop-b',
      barbershopName: 'Barbería Norte',
      role: 'administrator',
      ownBarberProfile: null,
    },
  ]);

  assert.deepEqual(
    spaces.map(({ title, href }) => ({ title, href })),
    [
      {
        title: 'Administrar Barbería Central',
        href: '/barbershops/barbershop-a',
      },
      {
        title: 'Administrar Barbería Norte',
        href: '/barbershops/barbershop-b',
      },
    ],
  );
});
