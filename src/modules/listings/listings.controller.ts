import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ListingsService } from "./listings.service";
import { CreateListingDto, UpdateListingDto } from "./dto";
import { JwtAuthGuard, type AuthedRequest } from "../auth/jwt-auth.guard";

@Controller("listings")
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  async list(
    @Query("market") market?: "US" | "MX",
    @Query("limit") limit?: string,
  ) {
    const items = await this.listings.list({
      market,
      limit: limit ? Number(limit) : undefined,
    });
    return { items };
  }

  @Get(":id")
  byId(@Param("id") id: string) {
    return this.listings.byId(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthedRequest, @Body() dto: CreateListingDto) {
    return this.listings.create(req.user.sub, dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Req() req: AuthedRequest, @Param("id") id: string, @Body() dto: UpdateListingDto) {
    return this.listings.update(req.user.sub, id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Req() req: AuthedRequest, @Param("id") id: string) {
    return this.listings.remove(req.user.sub, id);
  }
}
