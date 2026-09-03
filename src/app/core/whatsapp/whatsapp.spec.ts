import { construirUrlWhatsApp } from './whatsapp';

describe('construirUrlWhatsApp', () => {
  it('limpia el numero y antepone 57 (AC-01)', () => {
    const url = construirUrlWhatsApp('300 123-4567', 'hola');
    expect(url).toBe('https://wa.me/573001234567?text=hola');
  });

  it('encodea espacios y emojis del mensaje', () => {
    const url = construirUrlWhatsApp('3001234567', 'Hola 🧾 saldo 5000');
    expect(url).toBe(
      'https://wa.me/573001234567?text=' +
        encodeURIComponent('Hola 🧾 saldo 5000')
    );
  });

  it('quita parentesis, puntos y signos del numero', () => {
    const url = construirUrlWhatsApp('(300) 123.45.67', 'x');
    expect(url).toBe('https://wa.me/573001234567?text=x');
  });
});
