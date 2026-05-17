import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

// Dev-only credentials for manual exercise. DO NOT reuse in any non-dev env.
const USERS = [
  { email: "admin@compralo.local",  password: "AdminPass123!",  displayName: "Compralo Admin", role: "admin",  market: "US" },
  { email: "seller@compralo.local", password: "SellerPass123!", displayName: "María García",  role: "seller", market: "MX" },
  { email: "buyer@compralo.local",  password: "BuyerPass123!",  displayName: "John Smith",    role: "buyer",  market: "US" },
] as const;

type Owner = "admin" | "seller" | "buyer";

interface SeedListing {
  owner: Owner;
  title: string;
  description: string;
  priceCents: number;
  currency: "USD" | "MXN";
  condition: "new" | "like_new" | "used_good" | "used_fair" | "for_parts";
  market: "US" | "MX";
  status?: "active" | "paused" | "sold" | "removed";
}

const LISTINGS: SeedListing[] = [
  {
    owner: "seller",
    title: "iPhone 15 Pro 256GB — libre, como nuevo",
    description: "iPhone 15 Pro 256 GB, Titanio Natural. Liberado, batería 100%, sin rayones. Incluye caja y cable original.",
    priceCents: 2500000, currency: "MXN", condition: "like_new", market: "MX",
  },
  {
    owner: "seller",
    title: "2019 Honda Civic EX — un dueño, factura agencia",
    description: "Civic 2019 EX en excelentes condiciones. Servicios al corriente, factura original, sin choques.",
    priceCents: 28500000, currency: "MXN", condition: "used_good", market: "MX",
  },
  {
    owner: "seller",
    title: "Sala seccional 3 plazas — gris claro",
    description: "Sofá seccional de 3 plazas, tela antimanchas. Comprada hace 8 meses, prácticamente sin uso.",
    priceCents: 890000, currency: "MXN", condition: "like_new", market: "MX",
  },
  {
    owner: "buyer",
    title: "MacBook Air M2 13-inch — AppleCare+ until 2027",
    description: "M2 MacBook Air 13\", 8GB RAM, 256GB SSD. Bought Jan 2024, AppleCare+ through Jan 2027. Pristine, original box.",
    priceCents: 99900, currency: "USD", condition: "like_new", market: "US",
  },
  {
    owner: "buyer",
    title: "2020 Toyota Camry SE — clean title, low miles",
    description: "Single owner 2020 Camry SE, clean title, dealer-serviced. All-weather mats included.",
    priceCents: 2299500, currency: "USD", condition: "used_good", market: "US",
  },
  {
    owner: "admin",
    title: "Levi's 501 vintage jacket — size M, deadstock",
    description: "Vintage Levi's 501 trucker jacket, size M, deadstock condition. Original tags attached.",
    priceCents: 18000, currency: "USD", condition: "new", market: "US",
  },
  {
    owner: "admin",
    title: "iPad Pro 11\" 5th gen — WiFi 256GB",
    description: "iPad Pro 11\" 5th generation, WiFi only, 256GB, space grey. Includes Apple Pencil 2.",
    priceCents: 72500, currency: "USD", condition: "like_new", market: "US",
    status: "removed", // for exercising the status filter on GET /listings
  },
];

async function main() {
  console.log("Seeding users…");
  const ids: Record<Owner, string> = { admin: "", seller: "", buyer: "" };
  for (const u of USERS) {
    const passwordHash = await argon2.hash(u.password);
    const { password: _ignored, ...rest } = u;
    const saved = await prisma.user.upsert({
      where: { email: u.email },
      // Re-hash on every run so a password change in this file rolls forward.
      update: { passwordHash, displayName: u.displayName, role: u.role, market: u.market },
      create: { ...rest, passwordHash },
    });
    const owner = u.email.split("@")[0] as Owner;
    ids[owner] = saved.id;
  }

  console.log("Seeding listings…");
  for (const l of LISTINGS) {
    const sellerId = ids[l.owner];
    const exists = await prisma.listing.findFirst({ where: { sellerId, title: l.title } });
    if (exists) continue;
    await prisma.listing.create({
      data: {
        sellerId,
        title: l.title,
        description: l.description,
        priceCents: BigInt(l.priceCents),
        currency: l.currency,
        condition: l.condition,
        market: l.market,
        status: l.status ?? "active",
      },
    });
  }

  console.log("\nDemo logins (dev only):");
  for (const u of USERS) console.log(`  ${u.email}  /  ${u.password}  (${u.role}, ${u.market})`);
  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
