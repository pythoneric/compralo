import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../../common/prisma/prisma.service";
import { Locale, UserRole } from "@compralo/db";

// v1 uses local password auth so the stack is runnable end-to-end without Auth0.
// The plan recommends moving to Auth0/Clerk before launch — when that happens, this
// service becomes a thin wrapper that issues our session JWT from the IdP's id_token.
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signUp(dto: { email: string; password: string; displayName: string; market: "US" | "MX" }) {
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        market: dto.market,
        preferredLocale: dto.market === "MX" ? Locale.es_MX : Locale.en,
        role: UserRole.buyer,
      },
    });
    return this.issueToken(user.id);
  }

  async signIn(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) return null;
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) return null;
    return this.issueToken(user.id);
  }

  private issueToken(userId: string) {
    const token = this.jwt.sign({ sub: userId });
    return { token, userId };
  }
}
