export class Email {
  private readonly _address: string;

  constructor(address: string) {
    const trimmed = (address || '').trim().toLowerCase();
    if (
      !trimmed ||
      !trimmed.match(
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
      )
    ) {
      throw new Error(`Email inválido: "${address}"`);
    }
    this._address = trimmed;
  }

  get value(): string {
    return this._address;
  }

  toString(): string {
    return this._address;
  }
}
