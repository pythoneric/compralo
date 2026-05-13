import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { OfferStatus } from "@compralo/db";

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: { listingId: string; buyerId: string; amountCents: number; currency: string }) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing) throw new NotFoundException("listing");
    const offer = await this.prisma.offer.create({
      data: {
        listingId: dto.listingId,
        buyerId: dto.buyerId,
        amountCents: BigInt(dto.amountCents),
        currency: dto.currency,
        status: OfferStatus.pending,
      },
    });
    return { ...offer, amountCents: Number(offer.amountCents) };
  }

  async respond(id: string, decision: "accepted" | "rejected" | "countered", counter?: number) {
    const status =
      decision === "accepted"
        ? OfferStatus.accepted
        : decision === "rejected"
          ? OfferStatus.rejected
          : OfferStatus.countered;
    const offer = await this.prisma.offer.update({
      where: { id },
      data: {
        status,
        amountCents: counter !== undefined ? BigInt(counter) : undefined,
      },
    });
    return { ...offer, amountCents: Number(offer.amountCents) };
  }
}
