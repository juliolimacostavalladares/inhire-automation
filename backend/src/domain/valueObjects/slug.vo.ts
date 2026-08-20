export class Slug {
  private readonly _value: string;

  constructor(value: string) {
    const normalized = (value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '')
      .replace(/_{2,}/g, '_')
      .replace(/-{2,}/g, '-');

    if (!normalized || normalized.length < 2) {
      throw new Error(`Slug inválido: "${value}"`);
    }
    this._value = normalized;
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
