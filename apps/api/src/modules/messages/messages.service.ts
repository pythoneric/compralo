import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

// MVP in-app messaging in Postgres. The plan calls for Stream Chat at scale —
// when we swap, we keep `MessageThread` as the canonical record (for moderation/
// dispute evidence) and hand off realtime to Stream.
@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async openThread(listingId: string, buyerId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException("listing");
    const existing = await this.prisma.messageThread.findFirst({
      where: {
        listingId,
        members: { every: { userId: { in: [buyerId, listing.sellerId] } } },
      },
    });
    if (existing) return existing;
    return this.prisma.messageThread.create({
      data: {
        listingId,
        members: {
          create: [{ userId: buyerId }, { userId: listing.sellerId }],
        },
      },
    });
  }

  getThread(id: string) {
    return this.prisma.messageThread.findUniqueOrThrow({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, displayName: true } } } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  send(threadId: string, senderId: string, body: string) {
    return this.prisma.message.create({
      data: { threadId, senderId, body },
    });
  }
}
