import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from "class-validator";

export class CreateListingDto {
  @IsString() @Length(3, 200) title!: string;
  @IsString() @Length(10, 5000) description!: string;
  @IsInt() @Min(1) priceCents!: number;
  @IsString() @Length(3, 3) currency!: string;
  @IsOptional() @IsString() condition?: string;
  @IsEnum(["US", "MX"]) market!: "US" | "MX";
}

export class UpdateListingDto {
  @IsOptional() @IsString() @Length(3, 200) title?: string;
  @IsOptional() @IsString() @Length(10, 5000) description?: string;
  @IsOptional() @IsInt() @Min(1) priceCents?: number;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsEnum(["active", "paused", "sold", "removed"]) status?: string;
}
