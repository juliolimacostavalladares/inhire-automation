import type { Response } from 'express';

export class SessionCookieAdapter {
  private static readonly COOKIE_NAME = 'inhire_session';
  private static readonly COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

  static setSession(res: Response, token: string): void {
    res.cookie(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: this.COOKIE_MAX_AGE,
      path: '/',
    });
  }

  static clearSession(res: Response): void {
    res.clearCookie(this.COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
