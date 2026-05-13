import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import { IsInt, IsString, Min } from "class-validator";
import { OffersService } from "./offers.service";

class CreateOfferDto {
  @IsString() listingId!: string;
  @IsString() buyerId!: string;
  @IsInt() @Min(1) amountCents!: number;
  @IsString() currency!: string;
}

class RespondOfferDto {
  @IsString() decision!: "accepted" | "rejected" | "countered";
  @IsInt() @Min(1) counterAmountCents?: number;
}

@Controller("offers")
export class OffersController {
  constructor(private readonly svc: OffersService) {}

  @Post()
  create(@Body() dto: CreateOfferDto) {
    return this.svc.create(dto);
  }

  @Patch(":id")
  respond(@Param("id") id: string, @Body() dto: RespondOfferDto) {
    return this.svc.respond(id, dto.decision, dto.counterAmountCents);
  }
}
