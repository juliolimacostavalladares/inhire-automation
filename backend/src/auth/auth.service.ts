import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Environment } from "../config/environment";
import { PrismaService } from "../prisma/prisma.service";
import type { LoginDto, RegisterDto } from "./dto/auth.dto";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async register(input: RegisterDto) {
    const email = input.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(input.password, 12);
    try {
      const user = await this.prisma.user.create({
        data: { name: input.name.trim(), email, passwordHash },
      });
      return this.issueSession(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("E-mail já cadastrado");
      }
      throw error;
    }
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Credenciais inválidas");
    }
    return this.issueSession(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("Sessão inválida");
    return this.toPublicUser(user);
  }

  private issueSession(user: { id: string; email: string; name: string; role: string }) {
    const publicUser = this.toPublicUser(user);
    const accessToken = this.jwt.sign(
      { sub: publicUser.id, email: publicUser.email, role: publicUser.role },
      { secret: this.config.get("jwtSecret", { infer: true }), expiresIn: this.config.get("jwtExpiresIn", { infer: true }) },
    );
    return { accessToken, user: publicUser };
  }

  private toPublicUser(user: { id: string; email: string; name: string; role: string }): PublicUser {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
