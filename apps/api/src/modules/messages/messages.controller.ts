import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsString, Length } from "class-validator";
import { MessagesService } from "./messages.service";

class CreateMessageDto {
  @IsString() senderId!: string;
  @IsString() @Length(1, 4000) body!: string;
}

class OpenThreadDto {
  @IsString() listingId!: string;
  @IsString() buyerId!: string;
}

@Controller("threads")
export class MessagesController {
  constructor(private readonly svc: MessagesService) {}

  @Post()
  open(@Body() dto: OpenThreadDto) {
    return this.svc.openThread(dto.listingId, dto.buyerId);
  }

  @Get(":id")
  byId(@Param("id") id: string) {
    return this.svc.getThread(id);
  }

  @Post(":id/messages")
  send(@Param("id") id: string, @Body() dto: CreateMessageDto) {
    return this.svc.send(id, dto.senderId, dto.body);
  }
}
