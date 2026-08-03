import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService, LoginResponse, SesionCreada } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import {
  COOKIE_PATH,
  REFRESH_COOKIE,
  opcionesCookieRefresh,
} from './auth.cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    return this.enviarSesion(await this.authService.login(loginDto), res);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    return this.enviarSesion(await this.authService.refresh(refreshToken), res);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });
  }

  /** Deja el refresh token en la cookie httpOnly y devuelve solo el access token. */
  private enviarSesion(
    { respuesta, refreshToken }: SesionCreada,
    res: Response,
  ): LoginResponse {
    res.cookie(
      REFRESH_COOKIE,
      refreshToken,
      opcionesCookieRefresh(
        this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '5d',
      ),
    );

    return respuesta;
  }
}
