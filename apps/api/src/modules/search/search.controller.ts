import { Controller, Get, Query } from "@nestjs/common";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  query(
    @Query("q") q?: string,
    @Query("market") market?: "US" | "MX",
    @Query("categoryId") categoryId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.search.query({
      q,
      market,
      categoryId,
      limit: limit ? Math.min(Number(limit), 60) : 24,
    });
  }
}
