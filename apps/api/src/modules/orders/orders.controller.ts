import { Controller, Get, Param } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  @Get(":id")
  byId(@Param("id") id: string) {
    return this.svc.byId(id);
  }
}
