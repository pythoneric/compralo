import { Injectable } from "@nestjs/common";

// Calls NHTSA vPIC API for US (free, no key). Repuve (MX) integration is a TODO —
// it requires a contract and an API key from the Mexican government.
@Injectable()
export class VinService {
  async decode(vin: string) {
    const base = process.env.NHTSA_VPIC_BASE ?? "https://vpic.nhtsa.dot.gov/api";
    try {
      const res = await fetch(`${base}/vehicles/DecodeVinValues/${vin}?format=json`);
      if (!res.ok) throw new Error(`vPIC ${res.status}`);
      const json = (await res.json()) as { Results?: Array<Record<string, string>> };
      const r = json.Results?.[0] ?? {};
      return {
        vin,
        make: r.Make ?? null,
        model: r.Model ?? null,
        year: r.ModelYear ? Number(r.ModelYear) : null,
        trim: r.Trim ?? null,
        bodyStyle: r.BodyClass ?? null,
        fuelType: r.FuelTypePrimary ?? null,
        drivetrain: r.DriveType ?? null,
        transmission: r.TransmissionStyle ?? null,
        raw: r,
      };
    } catch (err) {
      return { vin, error: (err as Error).message };
    }
  }
}
