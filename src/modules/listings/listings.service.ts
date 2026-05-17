import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { CreateListingDto, UpdateListingDto } from "./dto";

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { market?: "US" | "MX"; limit?: number }) {
    const limit = Math.min(Math.max(params.limit ?? 24, 1), 60);
    const items = await this.prisma.listing.findMany({
      where: {
        market: params.market,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { seller: { select: { id: true, displayName: true } } },
    });
    return items.map(this.serialize);
  }

  async byId(id: string) {
    const item = await this.prisma.listing.findUnique({
      where: { id },
      include: { seller: { select: { id: true, displayName: true } } },
    });
    if (!item) throw new NotFoundException();
    return this.serialize(item);
  }

  async create(sellerId: string, dto: CreateListingDto) {
    const created = await this.prisma.listing.create({
      data: {
        sellerId,
        title: dto.title,
        description: dto.description,
        priceCents: BigInt(dto.priceCents),
        currency: dto.currency.toUpperCase(),
        condition: dto.condition ?? "used_good",
        market: dto.market,
        status: "active",
      },
      include: { seller: { select: { id: true, displayName: true } } },
    });
    return this.serialize(created);
  }

  async update(actorId: string, id: string, dto: UpdateListingDto) {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    if (existing.sellerId !== actorId) throw new ForbiddenException("Not your listing");
    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priceCents: dto.priceCents !== undefined ? BigInt(dto.priceCents) : undefined,
        condition: dto.condition,
        status: dto.status,
      },
      include: { seller: { select: { id: true, displayName: true } } },
    });
    return this.serialize(updated);
  }

  async remove(actorId: string, id: string) {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    if (existing.sellerId !== actorId) throw new ForbiddenException("Not your listing");
    await this.prisma.listing.delete({ where: { id } });
    return { ok: true };
  }

  private serialize<
    T extends { priceCents: bigint; seller?: { id: string; displayName: string } | null },
  >(row: T) {
    return { ...row, priceCents: Number(row.priceCents) };
  }
}
