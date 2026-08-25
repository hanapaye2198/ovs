import type { PublicTicket } from "@/lib/ovs.functions";

import { DEMO_VIOLATIONS, DEMO_VIOLATIONS_STORAGE_KEY } from "@/lib/demo-data";
import { normalizeVehiclePlate, sameVehiclePlate } from "@/lib/plate";

export function readDemoViolationsByPlate(vehiclePlate: string): PublicTicket[] {
  const normalizedPlate = normalizeVehiclePlate(vehiclePlate);
  let records = DEMO_VIOLATIONS;

  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(DEMO_VIOLATIONS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) records = parsed as typeof DEMO_VIOLATIONS;
      } catch {
        records = DEMO_VIOLATIONS;
      }
    }
  }

  return records
    .filter((record) => sameVehiclePlate(record.vehicle_plate, normalizedPlate))
    .map((record) => ({
      ticket_number: record.ticket_number,
      violator_name: record.violator_name,
      violation_type: record.violation_type,
      ordinance_code: record.ordinance_code,
      fine_amount: Number(record.fine_amount),
      location: record.location,
      issued_at: record.issued_at,
      status: record.status,
      vehicle_plate: normalizeVehiclePlate(record.vehicle_plate) || null,
    }));
}
