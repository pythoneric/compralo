import { Body, Controller, Post } from "@nestjs/common";
import { IsString, Length } from "class-validator";
import { VinService } from "./vin.service";

class DecodeVinDto {
  @IsString() @Length(11, 17) vin!: string;
}

@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vin: VinService) {}

  @Post("decode-vin")
  decode(@Body() dto: DecodeVinDto) {
    return this.vin.decode(dto.vin);
  }
}
