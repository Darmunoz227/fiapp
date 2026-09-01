import { verificarPin } from './pin';

describe('verificarPin', () => {
  it('sin PIN guardado (null) permite cualquier ingreso', () => {
    expect(verificarPin('lo-que-sea', null)).toBe(true);
  });

  it('PIN guardado vacio se trata como sin configurar (permite)', () => {
    expect(verificarPin('1234', '')).toBe(true);
  });

  it('PIN correcto devuelve true', () => {
    expect(verificarPin('1234', '1234')).toBe(true);
  });

  it('PIN correcto con espacios alrededor se acepta (trim)', () => {
    expect(verificarPin('  1234  ', '1234')).toBe(true);
  });

  it('PIN incorrecto devuelve false', () => {
    expect(verificarPin('9999', '1234')).toBe(false);
  });
});
