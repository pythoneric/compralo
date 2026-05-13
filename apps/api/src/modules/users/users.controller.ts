import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Controller("users")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(":id")
  async byId(@Param("id") id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        market: true,
        ratingAvg: true,
        ratingCount: true,
        responseTimeMin: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }
}
