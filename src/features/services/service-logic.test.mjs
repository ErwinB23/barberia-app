import assert from 'node:assert/strict';
import test from 'node:test';

import { formatPen, getCatalogStatusLabel } from './formatters.ts';
import { parseServiceForm, parseStyleForm } from './validation.ts';

test('valida y normaliza el nombre obligatorio de servicios y estilos', () => {
  const service = parseServiceForm({
    name: '  Corte   clásico  ',
    description: '  Corte con tijera  ',
    price: '35,50',
    durationMinutes: '45',
  });
  const invalidStyle = parseStyleForm({
    name: 'A',
    description: '',
    imageUrl: '',
  });

  assert.deepEqual(service.values, {
    name: 'Corte clásico',
    description: 'Corte con tijera',
    price: 35.5,
    durationMinutes: 45,
  });
  assert.deepEqual(service.errors, {});
  assert.equal(invalidStyle.errors.name, 'El nombre debe tener entre 2 y 120 caracteres.');
});

test('acepta precios PEN con dos decimales y rechaza valores fuera del esquema', () => {
  for (const price of ['0', '25', '25.5', '25,50', '99999999.99']) {
    const result = parseServiceForm({
      name: 'Corte clásico',
      description: '',
      price,
      durationMinutes: '30',
    });
    assert.equal(result.errors.price, undefined, `precio válido: ${price}`);
  }

  for (const price of ['-1', '1.999', '100000000', 'texto']) {
    const result = parseServiceForm({
      name: 'Corte clásico',
      description: '',
      price,
      durationMinutes: '30',
    });
    assert.ok(result.errors.price, `precio inválido: ${price}`);
  }
});

test('respeta el rango entero de duración definido por la base', () => {
  for (const durationMinutes of ['1', '30', '480']) {
    const result = parseServiceForm({
      name: 'Corte clásico',
      description: '',
      price: '25',
      durationMinutes,
    });
    assert.equal(result.errors.durationMinutes, undefined);
  }

  for (const durationMinutes of ['0', '1.5', '481', '']) {
    const result = parseServiceForm({
      name: 'Corte clásico',
      description: '',
      price: '25',
      durationMinutes,
    });
    assert.ok(result.errors.durationMinutes);
  }
});

test('solo acepta URL web segura y opcional para la imagen del estilo', () => {
  const empty = parseStyleForm({ name: 'Fade', description: '', imageUrl: '' });
  const secure = parseStyleForm({
    name: 'Fade',
    description: '',
    imageUrl: ' https://images.example.com/fade.jpg ',
  });
  const unsafe = parseStyleForm({
    name: 'Fade',
    description: '',
    imageUrl: 'javascript:alert(1)',
  });

  assert.equal(empty.values?.imageUrl, null);
  assert.equal(secure.values?.imageUrl, 'https://images.example.com/fade.jpg');
  assert.equal(
    unsafe.errors.imageUrl,
    'Ingresa una URL segura que empiece con http:// o https://.',
  );
});

test('presenta el precio PEN y los estados del catálogo de forma consistente', () => {
  assert.equal(formatPen(35.5), 'S/ 35.50');
  assert.equal(getCatalogStatusLabel(true), 'Activo');
  assert.equal(getCatalogStatusLabel(false), 'Inactivo');
});
