import { Injectable, OnModuleInit } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../../common/prisma/prisma.service";
import { Locale, UserRole } from "@compralo/db";

// v1 uses local password auth so the stack is runnable end-to-end without Auth0.
// The plan recommends moving to Auth0/Clerk before launch — when that happens, this
// service becomes a thin wrapper that issues our session JWT from the IdP's id_token.
@Injectable()
export class AuthService implements OnModuleInit {
  // Precomputed hash used to keep argon2.verify cost equal whether or not the
  // account exists — closes the timing-based user-enumeration channel.
  private dummyHash = "";

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit() {
    this.dummyHash = await argon2.hash("compralo-dummy-password-for-constant-time");
  }

  async signUp(dto: { email: string; password: string; displayName: string; market: "US" | "MX" }) {
    const email = this.normalizeEmail(dto.email);
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: dto.displayName,
        market: dto.market,
        preferredLocale: dto.market === "MX" ? Locale.es_MX : Locale.en,
        role: UserRole.buyer,
      },
    });
    return this.issueToken(user.id);
  }

  async signIn(rawEmail: string, password: string) {
    const email = this.normalizeEmail(rawEmail);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const hash = user?.passwordHash ?? this.dummyHash;
    const ok = await argon2.verify(hash, password);
    if (!ok || !user?.passwordHash) return null;
    return this.issueToken(user.id);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private issueToken(userId: string) {
    const token = this.jwt.sign({ sub: userId });
    return { token, userId };
  }
}
