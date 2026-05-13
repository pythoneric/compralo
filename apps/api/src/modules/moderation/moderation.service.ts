import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { ModerationReason, stringifyJson, type ModerationDecision } from "@compralo/db";

const DENYLIST_TERMS = [
  "weapon",
  "firearm",
  "drug",
  "ivory",
  // es-MX
  "arma",
  "droga",
];

// Pre-publish moderation pipeline. Order matters — cheapest checks first.
// At scale this swaps to async (BullMQ) so publish is non-blocking; for v1
// inline keeps the contract simple.
@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(listing: {
    id: string;
    title: string;
    description: string;
    priceCents: bigint;
    categoryId: string;
    vehicle?: { vin: string } | null;
    images: { url: string; pHash?: string | null }[];
  }): Promise<{ decision: ModerationDecision; reason?: string; signals: Record<string, unknown> }> {
    const signals: Record<string, unknown> = {};
    const text = `${listing.title} ${listing.description}`.toLowerCase();

    const matchedTerms = DENYLIST_TERMS.filter((t) => text.includes(t));
    if (matchedTerms.length > 0) {
      signals.denylist = matchedTerms;
      await this.record(listing.id, "rejected", ModerationReason.prohibited_item, signals);
      return { decision: "rejected", reason: ModerationReason.prohibited_item, signals };
    }

    if (listing.images.length < 1) {
      signals.imageCount = 0;
      await this.record(listing.id, "needs_review", ModerationReason.policy_violation, signals);
      return { decision: "needs_review", reason: ModerationReason.policy_violation, signals };
    }

    if (listing.vehicle && listing.vehicle.vin.length !== 17) {
      signals.vin = listing.vehicle.vin;
      await this.record(listing.id, "needs_review", ModerationReason.invalid_vin, signals);
      return { decision: "needs_review", reason: ModerationReason.invalid_vin, signals };
    }

    await this.record(listing.id, "approved", null, signals);
    return { decision: "approved", signals };
  }

  private async record(
    listingId: string,
    decision: ModerationDecision,
    reason: string | null,
    signals: Record<string, unknown>,
  ) {
    await this.prisma.moderationEvent.create({
      data: {
        listingId,
        decision,
        reason: reason ?? undefined,
        automated: true,
        signals: stringifyJson(signals),
      },
    });
  }
}
