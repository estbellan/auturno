export function formatDateTime(value: string | null, fallback = 'Not set'): string {
  return value ? new Date(value).toLocaleString() : fallback;
}

export function formatHours(value: number): string {
  return `${value}h`;
}

export function formatVehicleLabel(
  vehicle: {
    plate: string;
    brand: string | null;
    model: string | null;
    year: number | null;
  } | null | undefined,
  fallback: string,
): string {
  if (!vehicle) {
    return fallback;
  }

  const details = [vehicle.brand, vehicle.model, vehicle.year ? `${vehicle.year}` : null]
    .filter((item): item is string => Boolean(item))
    .join(' ');

  return details ? `${vehicle.plate} - ${details}` : vehicle.plate;
}

export function formatVehicleSummary(vehicle: {
  brand: string | null;
  model: string | null;
  year: number | null;
}): string {
  return [vehicle.brand, vehicle.model, vehicle.year ? `${vehicle.year}` : null]
    .filter((item): item is string => Boolean(item))
    .join(' ');
}

export function humanizeToken(value: string | null, fallback = 'Not set'): string {
  if (!value) {
    return fallback;
  }

  return value.replace(/_/g, ' ');
}

export function hasSearchTerm(value: string): boolean {
  return value.trim().length > 0;
}
