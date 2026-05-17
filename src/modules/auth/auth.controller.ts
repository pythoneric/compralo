import { Body, Controller, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { AuthService } from "./auth.service";
import { SignInRateLimitGuard } from "./sign-in-rate-limit.guard";

// Bound argon2 input so a long-input request can't push the server into CPU DoS.
const MAX_PASSWORD = 256;

class SignUpDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(8) @MaxLength(MAX_PASSWORD) password!: string;
  @IsString() @IsNotEmpty() @MaxLength(120) displayName!: string;
  @IsIn(["US", "MX"]) market!: "US" | "MX";
}

class SignInDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(1) @MaxLength(MAX_PASSWORD) password!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("sign-up")
  signUp(@Body() dto: SignUpDto) {
    return this.auth.signUp(dto);
  }

  @Post("sign-in")
  @UseGuards(SignInRateLimitGuard)
  async signIn(@Body() dto: SignInDto) {
    const result = await this.auth.signIn(dto.email, dto.password);
    if (!result) throw new UnauthorizedException("Invalid email or password");
    return result;
  }
}
