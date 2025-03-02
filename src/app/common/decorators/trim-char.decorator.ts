import { Transform } from 'class-transformer';

export function TrimChar() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();  // Aplica trim a las cadenas
    }
    return value;
  });
}
