import { Injectable } from '@nestjs/common';
import {
  JwtService as NestJwtService,
  JwtSignOptions,
  JwtVerifyOptions,
} from '@nestjs/jwt';

@Injectable()
export class JwtService {
  constructor(private readonly jwt: NestJwtService) {}

  /**
   * Sin `options` usa el secreto y la expiración configurados en LibModule
   * (los del access token). El refresh token pasa su propio secreto/expiración.
   */
  sign(payload: object, options?: JwtSignOptions): Promise<string> {
    return this.jwt.signAsync(payload, options);
  }

  verify<T extends object>(
    token: string,
    options?: JwtVerifyOptions,
  ): Promise<T> {
    return this.jwt.verifyAsync<T>(token, options);
  }

  decode<T extends object>(token: string): T | null {
    return this.jwt.decode<T | null>(token);
  }
}
