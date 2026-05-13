import { PrismaClient } from "@prisma/client";
import {
  Market,
  Locale,
  UserRole,
  Condition,
  SaleType,
  ListingStatus,
  Transmission,
  FuelType,
  Drivetrain,
  TitleStatus,
  AccidentHistory,
  stringifyJson,
} from "../src";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding categories…");

  await prisma.category.upsert({
    where: { id: "cat.vehicles" },
    update: {},
    create: {
      id: "cat.vehicles",
      slugEn: "vehicles",
      slugEs: "vehiculos",
      nameEn: "Vehicles",
      nameEs: "Vehículos",
      isLeaf: false,
      isVehicle: true,
      sortOrder: 1,
    },
  });

  await prisma.category.upsert({
    where: { id: "cat.vehicles.cars" },
    update: {},
    create: {
      id: "cat.vehicles.cars",
      parentId: "cat.vehicles",
      slugEn: "cars",
      slugEs: "autos",
      nameEn: "Cars",
      nameEs: "Autos",
      isLeaf: false,
      isVehicle: true,
    },
  });

  await prisma.category.upsert({
    where: { id: "cat.vehicles.cars.sedan" },
    update: {},
    create: {
      id: "cat.vehicles.cars.sedan",
      parentId: "cat.vehicles.cars",
      slugEn: "sedan",
      slugEs: "sedan",
      nameEn: "Sedan",
      nameEs: "Sedán",
      isLeaf: true,
      isVehicle: true,
    },
  });

  const other = [
    { id: "cat.electronics", slugEn: "electronics", slugEs: "electronica", nameEn: "Electronics", nameEs: "Electrónica", sortOrder: 2 },
    { id: "cat.home", slugEn: "home", slugEs: "hogar", nameEn: "Home & Garden", nameEs: "Hogar y Jardín", sortOrder: 3 },
    { id: "cat.fashion", slugEn: "fashion", slugEs: "moda", nameEn: "Fashion", nameEs: "Moda", sortOrder: 4 },
    { id: "cat.sports", slugEn: "sports", slugEs: "deportes", nameEn: "Sports", nameEs: "Deportes", sortOrder: 5 },
  ];
  for (const c of other) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, isLeaf: true, isVehicle: false },
    });
  }

  console.log("Seeding vehicle makes/models…");
  const honda = await prisma.vehicleMake.upsert({
    where: { name: "Honda" },
    update: {},
    create: { name: "Honda" },
  });
  for (const m of ["Civic", "Accord", "CR-V", "Fit"]) {
    await prisma.vehicleModel.upsert({
      where: { makeId_name: { makeId: honda.id, name: m } },
      update: {},
      create: { makeId: honda.id, name: m },
    });
  }

  console.log("Seeding demo users…");
  const seller = await prisma.user.upsert({
    where: { email: "demo-seller@compralo.local" },
    update: {},
    create: {
      email: "demo-seller@compralo.local",
      displayName: "María García",
      role: UserRole.seller,
      market: Market.MX,
      preferredLocale: Locale.es_MX,
      emailVerified: true,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "demo-buyer@compralo.local" },
    update: {},
    create: {
      email: "demo-buyer@compralo.local",
      displayName: "John Smith",
      role: UserRole.buyer,
      market: Market.US,
      preferredLocale: Locale.en,
      emailVerified: true,
    },
  });

  console.log("Seeding demo listings…");

  const civicExists = await prisma.listing.findFirst({ where: { sellerId: seller.id, title: { contains: "Civic" } } });
  if (!civicExists) {
    const civic = await prisma.listing.create({
      data: {
        sellerId: seller.id,
        categoryId: "cat.vehicles.cars.sedan",
        title: "2019 Honda Civic EX — 1 dueño, factura agencia",
        description:
          "Civic 2019 EX en excelentes condiciones. Servicios al corriente en agencia, factura original, no choques. Llantas nuevas, vidrios polarizados.",
        priceCents: BigInt(28500000),
        currency: "MXN",
        condition: Condition.used_good,
        quantity: 1,
        saleType: SaleType.offer,
        locationLabel: "Ciudad de México, CDMX",
        locationLat: 19.4326,
        locationLng: -99.1332,
        market: Market.MX,
        localeOrigin: Locale.es_MX,
        translations: stringifyJson({
          title: { en: "2019 Honda Civic EX — 1 owner, dealer-invoiced" },
          description: {
            en: "Civic 2019 EX in excellent condition. All dealer services current, original invoice, no accidents. New tires, tinted windows.",
          },
        }),
        status: ListingStatus.active,
        publishedAt: new Date(),
        vehicle: {
          create: {
            make: "Honda",
            model: "Civic",
            year: 2019,
            trim: "EX",
            vin: "2HGFC2F69KH123456",
            mileage: 62000,
            mileageUnit: "km",
            transmission: Transmission.cvt,
            fuelType: FuelType.gas,
            bodyStyle: "sedan",
            drivetrain: Drivetrain.fwd,
            exteriorColor: "blanco_perla",
            interiorColor: "negro",
            doors: 4,
            seats: 5,
            accidentHistory: AccidentHistory.none,
            titleStatus: TitleStatus.clean,
            serviceRecords: true,
            previousOwners: 1,
            vinVerified: false,
          },
        },
        images: {
          create: [
            { url: "https://placehold.co/1024x768/0F766E/white?text=Civic+1", altEn: "Front 3/4", altEs: "Frente 3/4", sortOrder: 0 },
            { url: "https://placehold.co/1024x768/0F766E/white?text=Civic+2", altEn: "Rear 3/4", altEs: "Trasero 3/4", sortOrder: 1 },
            { url: "https://placehold.co/1024x768/0F766E/white?text=Civic+3", altEn: "Interior", altEs: "Interior", sortOrder: 2 },
          ],
        },
      },
    });
    console.log("Created listing:", civic.id);
  }

  const electronicsExists = await prisma.listing.findFirst({ where: { sellerId: seller.id, categoryId: "cat.electronics" } });
  if (!electronicsExists) {
    await prisma.listing.create({
      data: {
        sellerId: seller.id,
        categoryId: "cat.electronics",
        title: "iPhone 14 Pro 256GB — desbloqueado",
        description: "iPhone 14 Pro 256GB en perfecto estado, sin rayones. Liberado de fábrica, batería al 92%. Incluye caja original.",
        priceCents: BigInt(1850000),
        currency: "MXN",
        condition: Condition.like_new,
        quantity: 1,
        saleType: SaleType.fixed,
        locationLabel: "Guadalajara, Jalisco",
        locationLat: 20.6597,
        locationLng: -103.3496,
        market: Market.MX,
        localeOrigin: Locale.es_MX,
        translations: stringifyJson({
          title: { en: "iPhone 14 Pro 256GB — unlocked" },
          description: { en: "iPhone 14 Pro 256GB in perfect condition, no scratches. Factory unlocked, 92% battery health. Original box included." },
        }),
        status: ListingStatus.active,
        publishedAt: new Date(),
        images: {
          create: [
            { url: "https://placehold.co/1024x768/0F766E/white?text=iPhone+1", sortOrder: 0 },
            { url: "https://placehold.co/1024x768/0F766E/white?text=iPhone+2", sortOrder: 1 },
          ],
        },
      },
    });
  }

  const f150Exists = await prisma.listing.findFirst({ where: { sellerId: buyer.id, title: { contains: "F-150" } } });
  if (!f150Exists) {
    await prisma.listing.create({
      data: {
        sellerId: buyer.id,
        categoryId: "cat.vehicles.cars.sedan",
        title: "2021 Ford F-150 XLT — one owner, clean carfax",
        description: "2021 Ford F-150 XLT SuperCrew 4x4. Clean Carfax, regular dealer maintenance, no accidents.",
        priceCents: BigInt(3499500),
        currency: "USD",
        condition: Condition.used_good,
        quantity: 1,
        saleType: SaleType.fixed,
        locationLabel: "Austin, TX",
        locationLat: 30.2672,
        locationLng: -97.7431,
        market: Market.US,
        localeOrigin: Locale.en,
        translations: stringifyJson({
          title: { "es-MX": "Ford F-150 XLT 2021 — un dueño, sin choques" },
          description: { "es-MX": "Ford F-150 XLT 2021 SuperCrew 4x4. Sin choques, servicios al corriente en agencia." },
        }),
        status: ListingStatus.active,
        publishedAt: new Date(),
        vehicle: {
          create: {
            make: "Ford",
            model: "F-150",
            year: 2021,
            trim: "XLT",
            vin: "1FTFW1E50MFA12345",
            mileage: 38500,
            mileageUnit: "mi",
            transmission: Transmission.automatic,
            fuelType: FuelType.gas,
            bodyStyle: "truck",
            drivetrain: Drivetrain.fourwd,
            exteriorColor: "oxford_white",
            interiorColor: "black",
            doors: 4,
            seats: 5,
            accidentHistory: AccidentHistory.none,
            titleStatus: TitleStatus.clean,
            serviceRecords: true,
            previousOwners: 1,
          },
        },
        images: {
          create: [
            { url: "https://placehold.co/1024x768/0F766E/white?text=F-150+1", sortOrder: 0 },
            { url: "https://placehold.co/1024x768/0F766E/white?text=F-150+2", sortOrder: 1 },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
