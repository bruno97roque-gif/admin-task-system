import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from './prisma/prisma.service';
import { Argon2Service } from './argon2/argon2.service';
import { JwtService } from './jwt/jwt.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            '1h') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [PrismaService, Argon2Service, JwtService],
  exports: [PrismaService, Argon2Service, JwtService],
})
export class LibModule {}
