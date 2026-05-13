import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class CreateListingImageDto {
  @IsString() url!: string;
  @IsOptional() @IsString() altEn?: string;
  @IsOptional() @IsString() altEs?: string;
}

export class CreateVehicleDto {
  @IsString() make!: string;
  @IsString() model!: string;
  @IsInt() year!: number;
  @IsOptional() @IsString() trim?: string;
  @IsString() @Length(11, 17) vin!: string;
  @IsInt() @Min(0) mileage!: number;
  @IsEnum(["km", "mi"]) mileageUnit!: "km" | "mi";
  @IsString() transmission!: string;
  @IsString() fuelType!: string;
  @IsString() bodyStyle!: string;
  @IsString() drivetrain!: string;
  @IsString() titleStatus!: string;
  @IsOptional() @IsString() accidentHistory?: string;
  @IsOptional() @IsInt() previousOwners?: number;
}

export class CreateListingDto {
  @IsString() sellerId!: string;
  @IsString() categoryId!: string;
  @IsString() @Length(3, 200) title!: string;
  @IsString() @Length(10, 5000) description!: string;
  @IsInt() @Min(1) priceCents!: number;
  @IsString() @Length(3, 3) currency!: string;
  @IsString() condition!: string;
  @IsOptional() @IsString() saleType?: string;
  @IsString() locationLabel!: string;
  @IsNumber() locationLat!: number;
  @IsNumber() locationLng!: number;
  @IsEnum(["US", "MX"]) market!: "US" | "MX";
  @IsEnum(["en", "es-MX"]) localeOrigin!: "en" | "es-MX";
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateListingImageDto) images?: CreateListingImageDto[];
  @IsOptional() @ValidateNested() @Type(() => CreateVehicleDto) vehicle?: CreateVehicleDto;
  @IsOptional() attributes?: Record<string, unknown>;
}

export class UpdateListingDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() priceCents?: number;
  @IsOptional() @IsString() status?: string;
}
