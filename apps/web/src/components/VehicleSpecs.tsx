import { useTranslations } from "next-intl";
import type { ListingDTO } from "@/lib/api";
import { formatMileage } from "@/lib/format";
import type { Market } from "@/i18n/config";

export function VehicleSpecs({ vehicle, market }: { vehicle: NonNullable<ListingDTO["vehicle"]>; market: Market }) {
  const t = useTranslations("listing");
  const rows: [string, string][] = [
    [t("vin"), vehicle.vin],
    [t("mileage"), formatMileage(vehicle.mileage, vehicle.mileageUnit, market)],
    [t("transmission"), vehicle.transmission],
    [t("fuelType"), vehicle.fuelType],
    [t("bodyStyle"), vehicle.bodyStyle],
    [t("drivetrain"), vehicle.drivetrain],
    [t("titleStatus"), vehicle.titleStatus],
    [t("accidentHistory"), vehicle.accidentHistory],
  ];
  if (vehicle.previousOwners !== undefined) {
    rows.push([t("previousOwners"), String(vehicle.previousOwners)]);
  }
  return (
    <section className="mt-6 rounded-lg border bg-white">
      <h2 className="border-b px-4 py-3 text-base font-semibold">{t("specs")}</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 p-4 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between border-b py-1 text-sm">
            <dt className="text-slate-500">{k}</dt>
            <dd className="font-medium text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
