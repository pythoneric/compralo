import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { OrderStatus } from "@compralo/db";
import { serializeListing } from "../../common/serialize";

// Commission policy lives here in one place — the plan says 8% on items, 3% on vehicles.
function commissionRateFor(isVehicle: boolean) {
  return isVehicle ? 0.03 : 0.08;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async byId(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { payments: true, listing: { include: { vehicle: true } } },
    });
    if (!order) throw new NotFoundException();
    return serializeListing(order as unknown as Record<string, unknown>);
  }

  async createFromListing(listingId: string, buyerId: string) {
    const listing = await this.prisma.listing.findUniqueOrThrow({
      where: { id: listingId },
      include: { vehicle: true },
    });
    const gross = listing.priceCents;
    const rate = commissionRateFor(Boolean(listing.vehicle));
    const commission = BigInt(Math.round(Number(gross) * rate));
    const net = gross - commission;
    return this.prisma.order.create({
      data: {
        listingId,
        buyerId,
        sellerId: listing.sellerId,
        grossCents: gross,
        commissionCents: commission,
        netCents: net,
        currency: listing.currency,
        market: listing.market,
        status: OrderStatus.pending,
      },
    });
  }
}
