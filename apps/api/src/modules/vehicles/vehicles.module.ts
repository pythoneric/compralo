import { Module } from "@nestjs/common";
import { VehiclesController } from "./vehicles.controller";
import { VinService } from "./vin.service";

@Module({
  controllers: [VehiclesController],
  providers: [VinService],
  exports: [VinService],
})
export class VehiclesModule {}
