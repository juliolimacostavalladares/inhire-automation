import { TenantOrigin } from '../enums';
import { Slug } from '../valueObjects/slug.vo';

export interface TenantProps {
  id?: string;
  slug: Slug | string;
  name: string;
  logoUrl?: string | null;
  origin: TenantOrigin;
  active?: boolean;
  lastValidatedAt?: Date | null;
  lastCollectedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Tenant {
  private readonly _id?: string;
  private _slug: Slug;
  private _name: string;
  private _logoUrl?: string | null;
  private _origin: TenantOrigin;
  private _active: boolean;
  private _lastValidatedAt?: Date | null;
  private _lastCollectedAt?: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TenantProps) {
    this._id = props.id;
    this._slug = props.slug instanceof Slug ? props.slug : new Slug(props.slug);
    this._name = (props.name || '').trim();
    if (!this._name) throw new Error('Nome do Tenant é obrigatório');
    this._logoUrl = props.logoUrl;
    this._origin = props.origin;
    this._active = props.active ?? true;
    this._lastValidatedAt = props.lastValidatedAt;
    this._lastCollectedAt = props.lastCollectedAt;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  get id(): string | undefined {
    return this._id;
  }
  get slug(): Slug {
    return this._slug;
  }
  get name(): string {
    return this._name;
  }
  get logoUrl(): string | null | undefined {
    return this._logoUrl;
  }
  get origin(): TenantOrigin {
    return this._origin;
  }
  get active(): boolean {
    return this._active;
  }

  updateLogo(logoUrl?: string | null): void {
    if (logoUrl) this._logoUrl = logoUrl;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._active = false;
    this._updatedAt = new Date();
  }
}
