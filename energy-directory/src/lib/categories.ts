import type { ProfessionalCategory } from "@/lib/types/database";

export const CATEGORY_LABELS: Record<ProfessionalCategory, string> = {
  solar_pv: "Solar PV",
  battery_storage: "Battery Storage",
  heat_pump_hot_water: "Heat Pump Hot Water",
  heat_pump_space_heating: "Heat Pump Heating/Cooling",
  induction_cooktop: "Induction Cooktop",
  ceiling_wall_insulation: "Insulation",
  double_glazing: "Double Glazing",
  draught_sealing: "Draught Sealing",
  ev_charger: "EV Charger Installation",
  home_energy_assessment: "Home Energy Assessment",
  electrification_general: "General Electrification",
};

export function categoryLabel(category: ProfessionalCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}
