import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { ListingsService } from "./listings.service";
import { CreateListingDto, UpdateListingDto } from "./dto";

@Controller("listings")
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  async list(
    @Query("market") market?: "US" | "MX",
    @Query("categoryId") categoryId?: string,
    @Query("limit") limit?: string,
  ) {
    const items = await this.listings.list({
      market,
      categoryId,
      limit: limit ? Math.min(Number(limit), 60) : 24,
    });
    return { items };
  }

  @Get(":id")
  async byId(@Param("id") id: string) {
    const listing = await this.listings.byId(id);
    if (!listing) throw new NotFoundException();
    return listing;
  }

  @Post()
  async create(@Body() dto: CreateListingDto) {
    return this.listings.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateListingDto) {
    return this.listings.update(id, dto);
  }

  @Post(":id/publish")
  async publish(@Param("id") id: string) {
    return this.listings.publish(id);
  }
}
