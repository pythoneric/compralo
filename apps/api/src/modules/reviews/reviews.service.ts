import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: { listingId: string; authorId: string; subjectId: string; rating: number; body?: string }) {
    const review = await this.prisma.review.create({ data: dto });
    await this.recomputeAverage(dto.subjectId);
    return review;
  }

  forUser(userId: string) {
    return this.prisma.review.findMany({
      where: { subjectId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  private async recomputeAverage(userId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { subjectId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
    });
  }
}
