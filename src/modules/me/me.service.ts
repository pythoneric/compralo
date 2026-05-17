import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async byId(userId: string) {
    // Whitelist fields so passwordHash can never leak through this endpoint.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        market: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }
}
