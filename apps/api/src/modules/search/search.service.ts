import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { serializeListing } from "../../common/serialize";
import { ListingStatus, type Prisma } from "@compralo/db";

// MVP search uses Postgres `ILIKE` against title/description plus optional facet filters.
// On SQLite we degrade to `contains` (case-sensitive on default collation; fine for demo).
// The plan calls for OpenSearch per locale at scale — that swap-in lives behind this
// service. The HTTP contract (`{ hits, total, facets }`) stays the same.
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async query(opts: { q?: string; market?: "US" | "MX"; categoryId?: string; limit: number }) {
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.active,
      ...(opts.market ? { market: opts.market } : {}),
      ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
      ...(opts.q
        ? {
            OR: [
              { title: { contains: opts.q } },
              { description: { contains: opts.q } },
            ],
          }
        : {}),
    };

    const [hits, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: {
          category: true,
          seller: { select: { id: true, displayName: true, ratingAvg: true, ratingCount: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          vehicle: true,
        },
        orderBy: { publishedAt: "desc" },
        take: opts.limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      hits: hits.map((h) => serializeListing(h as unknown as Record<string, unknown>)),
      total,
      facets: {} as Record<string, { value: string; count: number }[]>,
    };
  }
}
