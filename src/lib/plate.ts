export function normalizeVehiclePlate(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim().toUpperCase() ?? "";
}

export function sameVehiclePlate(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  const normalizedLeft = normalizeVehiclePlate(left);
  const normalizedRight = normalizeVehiclePlate(right);
  return Boolean(normalizedLeft) && normalizedLeft === normalizedRight;
}
