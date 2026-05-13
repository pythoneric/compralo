import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  }
}
