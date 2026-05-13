import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { CreateListingDto, UpdateListingDto } from "./dto";
import { ModerationService } from "../moderation/moderation.service";
import { serializeListing } from "../../common/serialize";
import {
  Locale,
  ListingStatus,
  SaleType,
  AccidentHistory,
  stringifyJson,
  type Prisma,
} from "@compralo/db";

const LISTING_INCLUDE = {
  category: true,
  seller: { select: { id: true, displayName: true, ratingAvg: true, ratingCount: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
  vehicle: true,
} satisfies Prisma.ListingInclude;

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ModerationService,
  ) {}

  list(opts: { market?: "US" | "MX"; categoryId?: string; limit: number }) {
    return this.prisma.listing
      .findMany({
        where: {
          status: ListingStatus.active,
          ...(opts.market ? { market: opts.market } : {}),
          ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
        },
        include: LISTING_INCLUDE,
        orderBy: { publishedAt: "desc" },
        take: opts.limit,
      })
      .then((rows) => rows.map((r) => serializeListing(r as unknown as Record<string, unknown>)));
  }

  async byId(id: string) {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      include: LISTING_INCLUDE,
    });
    if (!row) return null;
    await this.prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return serializeListing(row as unknown as Record<string, unknown>);
  }

  async create(dto: CreateListingDto) {
    const listing = await this.prisma.listing.create({
      data: {
        sellerId: dto.sellerId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        priceCents: BigInt(dto.priceCents),
        currency: dto.currency,
        condition: dto.condition,
        saleType: dto.saleType ?? SaleType.fixed,
        locationLabel: dto.locationLabel,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        market: dto.market,
        localeOrigin: dto.localeOrigin === "es-MX" ? Locale.es_MX : Locale.en,
        attributes: stringifyJson(dto.attributes),
        status: ListingStatus.draft,
        images: dto.images ? { create: dto.images.map((img, i) => ({ ...img, sortOrder: i })) } : undefined,
        vehicle: dto.vehicle
          ? {
              create: {
                make: dto.vehicle.make,
                model: dto.vehicle.model,
                year: dto.vehicle.year,
                trim: dto.vehicle.trim,
                vin: dto.vehicle.vin,
                mileage: dto.vehicle.mileage,
                mileageUnit: dto.vehicle.mileageUnit,
                transmission: dto.vehicle.transmission,
                fuelType: dto.vehicle.fuelType,
                bodyStyle: dto.vehicle.bodyStyle,
                drivetrain: dto.vehicle.drivetrain,
                titleStatus: dto.vehicle.titleStatus,
                accidentHistory: dto.vehicle.accidentHistory ?? AccidentHistory.unknown,
                previousOwners: dto.vehicle.previousOwners,
              },
            }
          : undefined,
      },
      include: LISTING_INCLUDE,
    });
    return serializeListing(listing as unknown as Record<string, unknown>);
  }

  async update(id: string, dto: UpdateListingDto) {
    const existing = await this.prisma.listing.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priceCents: dto.priceCents !== undefined ? BigInt(dto.priceCents) : undefined,
        status: dto.status,
      },
      include: LISTING_INCLUDE,
    });
    return serializeListing(updated as unknown as Record<string, unknown>);
  }

  async publish(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { vehicle: true, images: true },
    });
    if (!listing) throw new NotFoundException();
    const decision = await this.moderation.evaluate(listing);
    const status =
      decision.decision === "approved"
        ? ListingStatus.active
        : decision.decision === "needs_review"
          ? ListingStatus.pending_review
          : ListingStatus.removed;
    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status, publishedAt: status === ListingStatus.active ? new Date() : null },
      include: LISTING_INCLUDE,
    });
    return serializeListing(updated as unknown as Record<string, unknown>);
  }
}
