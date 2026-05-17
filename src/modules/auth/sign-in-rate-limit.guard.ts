import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";

interface Window {
  windowMs: number;
  max: number;
}

const IP_WINDOW: Window = { windowMs: 60_000, max: 20 };
const EMAIL_WINDOW: Window = { windowMs: 15 * 60_000, max: 10 };

// In-process sliding-window limiter. Single API instance only; swap to a
// Redis-backed limiter before horizontal scaling.
@Injectable()
export class SignInRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, number[]>();

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const ip = this.clientIp(req);
    const email = this.bodyEmail(req);
    const now = Date.now();

    const ipRetry = this.check(`ip:${ip}`, IP_WINDOW, now);
    const emailRetry = email ? this.check(`em:${email}`, EMAIL_WINDOW, now) : 0;
    const retryAfter = Math.max(ipRetry, emailRetry);

    if (retryAfter > 0) {
      const res = ctx.switchToHttp().getResponse();
      res.setHeader("Retry-After", Math.ceil(retryAfter / 1000));
      throw new HttpException(
        { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: "Too many attempts" },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private check(key: string, w: Window, now: number): number {
    const cutoff = now - w.windowMs;
    const arr = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    const oldest = arr[0];
    if (oldest !== undefined && arr.length >= w.max) return oldest + w.windowMs - now;
    arr.push(now);
    this.hits.set(key, arr);
    return 0;
  }

  private clientIp(req: Request): string {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.length > 0) {
      const first = xff.split(",")[0];
      if (first) return first.trim();
    }
    return req.ip ?? req.socket.remoteAddress ?? "unknown";
  }

  private bodyEmail(req: Request): string | null {
    const raw = (req.body as { email?: unknown } | undefined)?.email;
    if (typeof raw !== "string") return null;
    return raw.trim().toLowerCase().slice(0, 254);
  }
}
