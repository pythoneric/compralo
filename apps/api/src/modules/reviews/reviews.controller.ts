import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ReviewsService } from "./reviews.service";

class CreateReviewDto {
  @IsString() listingId!: string;
  @IsString() authorId!: string;
  @IsString() subjectId!: string;
  @IsInt() @Min(1) @Max(5) rating!: number;
  @IsOptional() @IsString() body?: string;
}

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this.svc.create(dto);
  }

  @Get("user/:userId")
  forUser(@Param("userId") userId: string) {
    return this.svc.forUser(userId);
  }
}
