import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard, type AuthedRequest } from "../auth/jwt-auth.guard";
import { MeService } from "./me.service";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  current(@Req() req: AuthedRequest) {
    return this.me.byId(req.user.sub);
  }
}
