import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../../lib/prisma/prisma.service';
import { Argon2Service } from '../../lib/argon2/argon2.service';
import { Prisma, User } from '../../lib/generated/prisma/client';

const sinPassword = { password: true } as const;

export type UserPublico = Omit<User, 'password'>;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly argon2: Argon2Service,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserPublico> {
    await this.validarRol(createUserDto.roleId);
    await this.validarUsuarioLibre(createUserDto.user);

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        password: await this.argon2.hash(createUserDto.password),
      },
      omit: sinPassword,
    });
  }

  findAll(): Promise<UserPublico[]> {
    return this.prisma.user.findMany({
      orderBy: { id: 'asc' },
      omit: sinPassword,
    });
  }

  async findOne(id: number): Promise<UserPublico> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: sinPassword,
    });

    if (!user) {
      throw this.notFound(id);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserPublico> {
    if (updateUserDto.roleId !== undefined) {
      await this.validarRol(updateUserDto.roleId);
    }

    if (updateUserDto.user !== undefined) {
      await this.validarUsuarioLibre(updateUserDto.user, id);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          ...(updateUserDto.password !== undefined && {
            password: await this.argon2.hash(updateUserDto.password),
          }),
        },
        omit: sinPassword,
      });
    } catch (error) {
      this.rethrow(error, id);
    }
  }

  async remove(id: number): Promise<UserPublico> {
    try {
      return await this.prisma.user.delete({
        where: { id },
        omit: sinPassword,
      });
    } catch (error) {
      this.rethrow(error, id);
    }
  }

  private async validarRol(roleId: number): Promise<void> {
    const rol = await this.prisma.rol.findUnique({
      where: { id: roleId },
      select: { id: true },
    });

    if (!rol) {
      throw new BadRequestException(`El rol con id ${roleId} no existe`);
    }
  }

  private async validarUsuarioLibre(
    user: string,
    exceptoId?: number,
  ): Promise<void> {
    const existente = await this.prisma.user.findUnique({
      where: { user },
      select: { id: true },
    });

    if (existente && existente.id !== exceptoId) {
      throw new ConflictException(`El usuario "${user}" ya está registrado`);
    }
  }

  private notFound(id: number): NotFoundException {
    return new NotFoundException(`Usuario con id ${id} no encontrado`);
  }

  private rethrow(error: unknown, id: number): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw this.notFound(id);
    }

    throw error;
  }
}
