import { Body, Controller, Post, UnauthorizedException } from "@nestjs/common";
import { IsEmail, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";

class SignUpDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() displayName!: string;
  @IsString() market!: "US" | "MX";
}

class SignInDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("sign-up")
  signUp(@Body() dto: SignUpDto) {
    return this.auth.signUp(dto);
  }

  @Post("sign-in")
  async signIn(@Body() dto: SignInDto) {
    const result = await this.auth.signIn(dto.email, dto.password);
    if (!result) throw new UnauthorizedException();
    return result;
  }
}
