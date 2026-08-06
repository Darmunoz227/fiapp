import { calcularPosicionCursor } from './caret-position';

describe('calcularPosicionCursor', () => {
  it('devuelve 0 cuando no hay digitos antes del cursor', () => {
    expect(calcularPosicionCursor('15.000', 0, '15.000')).toBe(0);
  });

  it('devuelve 0 con texto vacio', () => {
    expect(calcularPosicionCursor('', 0, '')).toBe(0);
  });

  it('ubica el cursor tras el primer digito', () => {
    expect(calcularPosicionCursor('15000', 1, '15.000')).toBe(1);
  });

  it('salta el separador al mapear la posicion', () => {
    expect(calcularPosicionCursor('15000', 2, '15.000')).toBe(2);
  });

  it('ubica el cursor despues del separador cuando hay tres digitos antes', () => {
    expect(calcularPosicionCursor('15000', 3, '15.000')).toBe(4);
  });

  it('devuelve el largo del formateado cuando el cursor esta al final', () => {
    expect(calcularPosicionCursor('15000', 5, '15.000')).toBe(6);
  });

  it('no se pasa del largo si pide mas digitos de los que hay', () => {
    expect(calcularPosicionCursor('15000', 99, '15.000')).toBe(6);
  });

  it('ignora caracteres no numericos al contar', () => {
    expect(calcularPosicionCursor('15.000', 3, '15.000')).toBe(2);
  });
});
