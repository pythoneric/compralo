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

// Dev-only credentials for manual UI testing. The hashes are argon2id, pinned so
// the seed has no runtime crypto dep. DO NOT reuse these in any non-dev env.
const DEV_USERS = {
  seller: {
    email: "demo-seller@compralo.local",
    password: "SellerPass123!",
    passwordHash:
      "$argon2id$v=19$m=65536,t=3,p=4$ta9qWHhSbOpqF/fFFicMAw$3xV/9+Z2J8TgPLz1TGE1IGipmjwyrsXdha+JZ8TvdOw",
  },
  buyer: {
    email: "demo-buyer@compralo.local",
    password: "BuyerPass123!",
    passwordHash:
      "$argon2id$v=19$m=65536,t=3,p=4$2TpHkUUQRj8YkMrJ8Fk/vg$BRZbrYZEM9ZXPws2v0wdX9HIEB/4YjipKzk4bD4py7o",
  },
  admin: {
    email: "admin@compralo.local",
    password: "AdminPass123!",
    passwordHash:
      "$argon2id$v=19$m=65536,t=3,p=4$5tyvw7GzQu5nywGKxcZIbQ$TqigOyNDlmMj63/LgwjNW/7sN3KjZQRgijCZbvakbiQ",
  },
} as const;

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

  const vehicleLeaves = [
    { id: "cat.vehicles.cars.sedan", slugEn: "sedan", slugEs: "sedan", nameEn: "Sedan", nameEs: "Sedán" },
    { id: "cat.vehicles.cars.suv",   slugEn: "suv",   slugEs: "suv",   nameEn: "SUV",   nameEs: "SUV"   },
    { id: "cat.vehicles.trucks",     slugEn: "trucks",slugEs: "camionetas", nameEn: "Trucks", nameEs: "Camionetas" },
  ];
  for (const v of vehicleLeaves) {
    await prisma.category.upsert({
      where: { id: v.id },
      update: {},
      create: {
        ...v,
        parentId: v.id === "cat.vehicles.trucks" ? "cat.vehicles" : "cat.vehicles.cars",
        isLeaf: true,
        isVehicle: true,
      },
    });
  }

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
  const makes: Record<string, string[]> = {
    Honda: ["Civic", "Accord", "CR-V", "Fit"],
    Toyota: ["Corolla", "Camry", "RAV4", "Hilux"],
    Ford: ["F-150", "Mustang", "Escape", "Bronco"],
    Nissan: ["Versa", "Sentra", "Altima", "X-Trail"],
    Volkswagen: ["Jetta", "Tiguan", "Polo", "Vento"],
    Mazda: ["3", "CX-5", "MX-5"],
  };
  for (const [makeName, models] of Object.entries(makes)) {
    const make = await prisma.vehicleMake.upsert({
      where: { name: makeName },
      update: {},
      create: { name: makeName },
    });
    for (const m of models) {
      await prisma.vehicleModel.upsert({
        where: { makeId_name: { makeId: make.id, name: m } },
        update: {},
        create: { makeId: make.id, name: m },
      });
    }
  }

  console.log("Seeding demo users…");
  const seller = await prisma.user.upsert({
    where: { email: DEV_USERS.seller.email },
    update: { passwordHash: DEV_USERS.seller.passwordHash },
    create: {
      email: DEV_USERS.seller.email,
      passwordHash: DEV_USERS.seller.passwordHash,
      displayName: "María García",
      role: UserRole.seller,
      market: Market.MX,
      preferredLocale: Locale.es_MX,
      emailVerified: true,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: DEV_USERS.buyer.email },
    update: { passwordHash: DEV_USERS.buyer.passwordHash },
    create: {
      email: DEV_USERS.buyer.email,
      passwordHash: DEV_USERS.buyer.passwordHash,
      displayName: "John Smith",
      role: UserRole.buyer,
      market: Market.US,
      preferredLocale: Locale.en,
      emailVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: DEV_USERS.admin.email },
    update: { passwordHash: DEV_USERS.admin.passwordHash },
    create: {
      email: DEV_USERS.admin.email,
      passwordHash: DEV_USERS.admin.passwordHash,
      displayName: "Compralo Admin",
      role: UserRole.admin,
      market: Market.US,
      preferredLocale: Locale.en,
      emailVerified: true,
    },
  });

  console.log("Demo logins (dev only):");
  console.log(`  seller:  ${DEV_USERS.seller.email} / ${DEV_USERS.seller.password}  (MX)`);
  console.log(`  buyer:   ${DEV_USERS.buyer.email}  / ${DEV_USERS.buyer.password}   (US)`);
  console.log(`  admin:   ${DEV_USERS.admin.email}  / ${DEV_USERS.admin.password}   (US)`);

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

  // ─── Extra listings for manual UI exercise ──────────────────────────────
  // Coverage goals: both markets, multiple categories, every saleType, a sold
  // record, and a pending_review record so the moderation queue is non-empty.
  type ExtraSeller = "seller" | "buyer" | "admin";
  type ExtraListing = {
    sellerKey: ExtraSeller;
    title: string;
    description: string;
    categoryId: string;
    priceCents: bigint;
    currency: "USD" | "MXN";
    condition: (typeof Condition)[keyof typeof Condition];
    saleType: (typeof SaleType)[keyof typeof SaleType];
    market: (typeof Market)[keyof typeof Market];
    localeOrigin: (typeof Locale)[keyof typeof Locale];
    locationLabel: string;
    locationLat: number;
    locationLng: number;
    status: (typeof ListingStatus)[keyof typeof ListingStatus];
    translations: { title: Record<string, string>; description: Record<string, string> };
    vehicle?: {
      make: string;
      model: string;
      year: number;
      trim?: string;
      vin: string;
      mileage: number;
      mileageUnit: "km" | "mi";
      transmission: (typeof Transmission)[keyof typeof Transmission];
      fuelType: (typeof FuelType)[keyof typeof FuelType];
      bodyStyle: string;
      drivetrain: (typeof Drivetrain)[keyof typeof Drivetrain];
    };
    imageLabel: string;
  };

  const sellersByKey: Record<ExtraSeller, string> = {
    seller: seller.id,
    buyer: buyer.id,
    admin: admin.id,
  };

  const extras: ExtraListing[] = [
    {
      sellerKey: "seller",
      title: "2022 Toyota RAV4 XLE — un dueño, garantía vigente",
      description: "RAV4 XLE 2022, factura original, servicios en agencia, llantas nuevas. Garantía Toyota vigente.",
      categoryId: "cat.vehicles.cars.suv",
      priceCents: BigInt(48900000),
      currency: "MXN",
      condition: Condition.used_good,
      saleType: SaleType.offer,
      market: Market.MX,
      localeOrigin: Locale.es_MX,
      locationLabel: "Monterrey, NL",
      locationLat: 25.6866,
      locationLng: -100.3161,
      status: ListingStatus.active,
      translations: {
        title: { en: "2022 Toyota RAV4 XLE — one owner, factory warranty" },
        description: { en: "2022 RAV4 XLE, original invoice, dealer-maintained, new tires. Toyota factory warranty still active." },
      },
      vehicle: {
        make: "Toyota", model: "RAV4", year: 2022, trim: "XLE",
        vin: "JTMRWRFV0ND123456", mileage: 38000, mileageUnit: "km",
        transmission: Transmission.automatic, fuelType: FuelType.gas,
        bodyStyle: "suv", drivetrain: Drivetrain.awd,
      },
      imageLabel: "RAV4",
    },
    {
      sellerKey: "buyer",
      title: "2020 Toyota Camry SE — clean title, low miles",
      description: "2020 Camry SE in great shape. Single owner, clean title, dealer-serviced, all-weather mats included.",
      categoryId: "cat.vehicles.cars.sedan",
      priceCents: BigInt(2299500),
      currency: "USD",
      condition: Condition.used_good,
      saleType: SaleType.fixed,
      market: Market.US,
      localeOrigin: Locale.en,
      locationLabel: "San Antonio, TX",
      locationLat: 29.4241,
      locationLng: -98.4936,
      status: ListingStatus.active,
      translations: {
        title: { "es-MX": "Toyota Camry SE 2020 — factura limpia, poco kilometraje" },
        description: { "es-MX": "Camry SE 2020 en excelentes condiciones. Un dueño, factura limpia, servicios en agencia." },
      },
      vehicle: {
        make: "Toyota", model: "Camry", year: 2020, trim: "SE",
        vin: "4T1G11AK1LU123456", mileage: 32000, mileageUnit: "mi",
        transmission: Transmission.automatic, fuelType: FuelType.gas,
        bodyStyle: "sedan", drivetrain: Drivetrain.fwd,
      },
      imageLabel: "Camry",
    },
    {
      sellerKey: "seller",
      title: "2018 Toyota Hilux SR5 4x4 — diésel, ideal para trabajo",
      description: "Hilux 4x4 diésel, ideal para trabajo pesado. Mantenimiento al corriente, cama protegida.",
      categoryId: "cat.vehicles.trucks",
      priceCents: BigInt(52500000),
      currency: "MXN",
      condition: Condition.used_good,
      saleType: SaleType.fixed,
      market: Market.MX,
      localeOrigin: Locale.es_MX,
      locationLabel: "Querétaro, QRO",
      locationLat: 20.5888,
      locationLng: -100.3899,
      status: ListingStatus.active,
      translations: {
        title: { en: "2018 Toyota Hilux SR5 4x4 — diesel, work-ready" },
        description: { en: "Hilux 4x4 diesel, perfect for heavy work. Up-to-date service, bed liner installed." },
      },
      vehicle: {
        make: "Toyota", model: "Hilux", year: 2018, trim: "SR5",
        vin: "MR0FZ29G1J0123456", mileage: 95000, mileageUnit: "km",
        transmission: Transmission.manual, fuelType: FuelType.diesel,
        bodyStyle: "truck", drivetrain: Drivetrain.fourwd,
      },
      imageLabel: "Hilux",
    },
    {
      sellerKey: "buyer",
      title: "MacBook Pro 14\" M3 Pro — AppleCare+ until 2027",
      description: "M3 Pro 14\" MacBook Pro, 18GB RAM, 1TB SSD. Bought Jan 2024, AppleCare+ through Jan 2027. Mint, original box.",
      categoryId: "cat.electronics",
      priceCents: BigInt(189000),
      currency: "USD",
      condition: Condition.like_new,
      saleType: SaleType.offer,
      market: Market.US,
      localeOrigin: Locale.en,
      locationLabel: "Brooklyn, NY",
      locationLat: 40.6782,
      locationLng: -73.9442,
      status: ListingStatus.active,
      translations: {
        title: { "es-MX": "MacBook Pro 14\" M3 Pro — AppleCare+ hasta 2027" },
        description: { "es-MX": "MacBook Pro 14\" M3 Pro, 18 GB RAM, 1 TB SSD. AppleCare+ vigente hasta enero 2027." },
      },
      imageLabel: "MacBook",
    },
    {
      sellerKey: "seller",
      title: "Sala seccional 3 plazas — gris claro, como nueva",
      description: "Sala seccional de 3 plazas, tela antimanchas, gris claro. Comprada hace 8 meses, sin uso fuerte.",
      categoryId: "cat.home",
      priceCents: BigInt(890000),
      currency: "MXN",
      condition: Condition.like_new,
      saleType: SaleType.offer,
      market: Market.MX,
      localeOrigin: Locale.es_MX,
      locationLabel: "Ciudad de México, CDMX",
      locationLat: 19.4326,
      locationLng: -99.1332,
      status: ListingStatus.active,
      translations: {
        title: { en: "3-seat sectional sofa — light grey, like new" },
        description: { en: "Three-seat sectional, stain-resistant fabric, light grey. Bought 8 months ago, lightly used." },
      },
      imageLabel: "Sofa",
    },
    {
      sellerKey: "admin",
      title: "Levi's 501 vintage jacket — size M, deadstock",
      description: "Vintage Levi's 501 trucker jacket, size M, deadstock condition. Original tags attached.",
      categoryId: "cat.fashion",
      priceCents: BigInt(18000),
      currency: "USD",
      condition: Condition.new,
      saleType: SaleType.fixed,
      market: Market.US,
      localeOrigin: Locale.en,
      locationLabel: "Portland, OR",
      locationLat: 45.5152,
      locationLng: -122.6784,
      status: ListingStatus.active,
      translations: {
        title: { "es-MX": "Chamarra Levi's 501 vintage — talla M, sin uso" },
        description: { "es-MX": "Chamarra trucker Levi's 501 vintage, talla M, sin uso, con etiquetas originales." },
      },
      imageLabel: "Levis",
    },
    {
      sellerKey: "seller",
      title: "Bicicleta de ruta Specialized Allez — talla 54",
      description: "Specialized Allez 2021 talla 54, shifters Shimano 105, ruedas DT Swiss. Lista para rodar.",
      categoryId: "cat.sports",
      priceCents: BigInt(1450000),
      currency: "MXN",
      condition: Condition.used_good,
      saleType: SaleType.fixed,
      market: Market.MX,
      localeOrigin: Locale.es_MX,
      locationLabel: "Guadalajara, Jalisco",
      locationLat: 20.6597,
      locationLng: -103.3496,
      status: ListingStatus.sold,
      translations: {
        title: { en: "Specialized Allez road bike — size 54" },
        description: { en: "2021 Specialized Allez, size 54, Shimano 105 shifters, DT Swiss wheels. Ready to ride." },
      },
      imageLabel: "Bike",
    },
    {
      sellerKey: "buyer",
      title: "iPad Pro 11\" 5th gen — WiFi 256GB",
      description: "iPad Pro 11\" 5th gen, WiFi only, 256GB, space grey. Includes Apple Pencil 2.",
      categoryId: "cat.electronics",
      priceCents: BigInt(72500),
      currency: "USD",
      condition: Condition.like_new,
      saleType: SaleType.fixed,
      market: Market.US,
      localeOrigin: Locale.en,
      locationLabel: "Seattle, WA",
      locationLat: 47.6062,
      locationLng: -122.3321,
      status: ListingStatus.pending_review,
      translations: {
        title: { "es-MX": "iPad Pro 11\" 5ta gen — WiFi 256 GB" },
        description: { "es-MX": "iPad Pro 11\" 5ta generación, solo WiFi, 256 GB, gris espacial. Incluye Apple Pencil 2." },
      },
      imageLabel: "iPad",
    },
  ];

  for (const x of extras) {
    const exists = await prisma.listing.findFirst({ where: { title: x.title } });
    if (exists) continue;
    await prisma.listing.create({
      data: {
        sellerId: sellersByKey[x.sellerKey],
        categoryId: x.categoryId,
        title: x.title,
        description: x.description,
        priceCents: x.priceCents,
        currency: x.currency,
        condition: x.condition,
        quantity: 1,
        saleType: x.saleType,
        locationLabel: x.locationLabel,
        locationLat: x.locationLat,
        locationLng: x.locationLng,
        market: x.market,
        localeOrigin: x.localeOrigin,
        translations: stringifyJson(x.translations),
        status: x.status,
        publishedAt: x.status === ListingStatus.draft ? null : new Date(),
        soldAt: x.status === ListingStatus.sold ? new Date() : null,
        ...(x.vehicle
          ? {
              vehicle: {
                create: {
                  make: x.vehicle.make,
                  model: x.vehicle.model,
                  year: x.vehicle.year,
                  trim: x.vehicle.trim,
                  vin: x.vehicle.vin,
                  mileage: x.vehicle.mileage,
                  mileageUnit: x.vehicle.mileageUnit,
                  transmission: x.vehicle.transmission,
                  fuelType: x.vehicle.fuelType,
                  bodyStyle: x.vehicle.bodyStyle,
                  drivetrain: x.vehicle.drivetrain,
                  accidentHistory: AccidentHistory.none,
                  titleStatus: TitleStatus.clean,
                  serviceRecords: true,
                  previousOwners: 1,
                },
              },
            }
          : {}),
        images: {
          create: [
            { url: `https://placehold.co/1024x768/0F766E/white?text=${x.imageLabel}+1`, sortOrder: 0 },
            { url: `https://placehold.co/1024x768/0F766E/white?text=${x.imageLabel}+2`, sortOrder: 1 },
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
