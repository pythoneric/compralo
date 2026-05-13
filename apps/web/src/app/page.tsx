// Middleware redirects "/" to "/en" or "/mx" — this file exists only to silence Next.js warnings
// in case the middleware ever misses the request (e.g. during static export).
import { redirect } from "next/navigation";
import { DEFAULT_MARKET } from "@/i18n/config";

export default function Root() {
  redirect(`/${DEFAULT_MARKET}`);
}
