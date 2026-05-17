import { Injectable, OnModuleInit } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class AuthService implements OnModuleInit {
  // Precomputed dummy hash keeps argon2.verify cost equal whether or not the
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
        role: "buyer",
      },
    });
    return this.issueToken(user.id);
  }

  async signIn(rawEmail: string, password: string) {
    const email = this.normalizeEmail(rawEmail);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const hash = user?.passwordHash ?? this.dummyHash;
    const ok = await argon2.verify(hash, password);
    if (!ok || !user) return null;
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
