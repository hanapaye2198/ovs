import type { PublicTicket, CitizenPayment } from "@/lib/ovs.functions";
import type { Tables } from "@/integrations/supabase/types";

/** This project is intentionally configured as a self-contained product demo. */
export const DEMO_MODE = true;
export const DEMO_STAFF_SESSION_KEY = "ovs-demo-staff-session";
export const DEMO_STAFF_SESSION_EVENT = "ovs-demo-auth-change";
export const DEMO_CITIZEN_SESSION_KEY = "ovs-demo-citizen-session";
export const DEMO_VIOLATIONS_STORAGE_KEY = "ovs-demo-violations";
export const DEMO_PAYMENTS_STORAGE_KEY = "ovs-demo-payments";

export const DEMO_STAFF_ACCOUNTS = [
  {
    email: "admin@ovs.demo",
    password: "demo1234",
    role: "admin",
    displayName: "Demo Administrator",
    summary: "Full access to records, payments, and staff oversight.",
  },
  {
    email: "encoder@ovs.demo",
    password: "demo1234",
    role: "encoder",
    displayName: "Demo Encoder",
    summary: "Create and update violation records from the field.",
  },
  {
    email: "viewer@ovs.demo",
    password: "demo1234",
    role: "viewer",
    displayName: "Demo Viewer",
    summary: "Read-only access to tickets, status, and collections.",
  },
] as const;

export type DemoStaffAccount = (typeof DEMO_STAFF_ACCOUNTS)[number];
export type DemoStaffRole = DemoStaffAccount["role"];
export type DemoStaffSession = Pick<DemoStaffAccount, "email" | "role" | "displayName">;

export const DEMO_STAFF = DEMO_STAFF_ACCOUNTS[0];

export function findDemoStaffAccount(email: string, password: string) {
  return DEMO_STAFF_ACCOUNTS.find(
    (account) => account.email === email.trim().toLowerCase() && account.password === password,
  );
}

export function readDemoStaffSession(): DemoStaffSession | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(DEMO_STAFF_SESSION_KEY);
  if (!stored) return null;

  if (stored === "active") {
    return {
      email: DEMO_STAFF.email,
      role: DEMO_STAFF.role,
      displayName: DEMO_STAFF.displayName,
    };
  }

  try {
    const session = JSON.parse(stored) as Partial<DemoStaffSession>;
    if (
      typeof session.email === "string" &&
      typeof session.displayName === "string" &&
      (session.role === "admin" || session.role === "encoder" || session.role === "viewer")
    ) {
      return { email: session.email, role: session.role, displayName: session.displayName };
    }
  } catch {
    return null;
  }

  return null;
}

export function saveDemoStaffSession(account: DemoStaffAccount) {
  window.localStorage.setItem(
    DEMO_STAFF_SESSION_KEY,
    JSON.stringify({ email: account.email, role: account.role, displayName: account.displayName }),
  );
  window.dispatchEvent(new Event(DEMO_STAFF_SESSION_EVENT));
}

export function clearDemoStaffSession() {
  window.localStorage.removeItem(DEMO_STAFF_SESSION_KEY);
  window.dispatchEvent(new Event(DEMO_STAFF_SESSION_EVENT));
}

export const DEMO_CITIZEN = {
  email: "citizen@ovs.demo",
  password: "demo1234",
  fullName: "Demo Citizen",
};

export const DEMO_TICKETS: PublicTicket[] = [
  {
    ticket_number: "OVS-2026-000101",
    violator_name: "J**n D**a C***z",
    violation_type: "Disregarding Traffic Signs",
    ordinance_code: "Ord. 1557-11 Sec. 12",
    fine_amount: 1000,
    location: "Quirino Ave. cor. Bonifacio St.",
    issued_at: "2026-08-22T09:15:00.000Z",
    status: "unpaid",
    vehicle_plate: "LAB 2841",
  },
  {
    ticket_number: "OVS-2026-000102",
    violator_name: "M**a S****s",
    violation_type: "No Helmet (Driver)",
    ordinance_code: "Ord. 0300-07 Sec. 5",
    fine_amount: 500,
    location: "McArthur Hwy, Matina Crossing",
    issued_at: "2026-08-20T14:30:00.000Z",
    status: "paid",
    vehicle_plate: "ABC 1122",
  },
  {
    ticket_number: "OVS-2026-000103",
    violator_name: "P**r R***s",
    violation_type: "Illegal Parking",
    ordinance_code: "Ord. 1557-11 Sec. 22",
    fine_amount: 1500,
    location: "Toril Public Market",
    issued_at: "2026-08-24T08:05:00.000Z",
    status: "unpaid",
    vehicle_plate: "XYZ 7788",
  },
  {
    ticket_number: "OVS-2026-000104",
    violator_name: "A** L*****o",
    violation_type: "Anti-Smoking Ordinance",
    ordinance_code: "Ord. 0367-12 Sec. 4",
    fine_amount: 500,
    location: "Buhangin Terminal",
    issued_at: "2026-08-16T11:40:00.000Z",
    status: "paid",
    vehicle_plate: "DEF 9021",
  },
  {
    ticket_number: "OVS-2026-000105",
    violator_name: "C**o B********a",
    violation_type: "Obstruction of Sidewalk",
    ordinance_code: "Ord. 1557-11 Sec. 31",
    fine_amount: 2000,
    location: "Agdao Public Market",
    issued_at: "2026-08-25T07:50:00.000Z",
    status: "unpaid",
    vehicle_plate: "GHI 3345",
  },
  {
    ticket_number: "OVS-2026-000106",
    violator_name: "L**a R****s",
    violation_type: "Overloading",
    ordinance_code: "Ord. 1557-11 Sec. 18",
    fine_amount: 1000,
    location: "Ulas Junction",
    issued_at: "2026-08-19T16:20:00.000Z",
    status: "contested",
    vehicle_plate: "JKL 5567",
  },
  {
    ticket_number: "OVS-2026-000107",
    violator_name: "M**l T*****s",
    violation_type: "Anti-Littering",
    ordinance_code: "Ord. 0361-12 Sec. 3",
    fine_amount: 300,
    location: "Mintal Diversion Rd.",
    issued_at: "2026-08-18T10:05:00.000Z",
    status: "unpaid",
    vehicle_plate: "MNO 7789",
  },
  {
    ticket_number: "OVS-2026-000108",
    violator_name: "G**c A********a",
    violation_type: "Beating the Red Light",
    ordinance_code: "Ord. 1557-11 Sec. 9",
    fine_amount: 1000,
    location: "JP Laurel Ave., Lanang",
    issued_at: "2026-08-23T13:10:00.000Z",
    status: "paid",
    vehicle_plate: "PQR 1123",
  },
  {
    ticket_number: "OVS-2026-000109",
    violator_name: "R**o V********a",
    violation_type: "No Parking in Loading Zone",
    ordinance_code: "Ord. 1557-11 Sec. 25",
    fine_amount: 1200,
    location: "Sasa Wharf Road",
    issued_at: "2026-08-21T09:40:00.000Z",
    status: "paid",
    vehicle_plate: "STU 6612",
  },
  {
    ticket_number: "OVS-2026-000110",
    violator_name: "S**a M******o",
    violation_type: "Noise Disturbance",
    ordinance_code: "Ord. 0367-12 Sec. 8",
    fine_amount: 800,
    location: "Calinan Town Center",
    issued_at: "2026-08-15T20:25:00.000Z",
    status: "cancelled",
    vehicle_plate: "VWX 4477",
  },
];

export const DEMO_CITIZEN_TICKETS: PublicTicket[] = DEMO_TICKETS.filter((ticket) =>
  ["OVS-2026-000101", "OVS-2026-000102", "OVS-2026-000109"].includes(ticket.ticket_number),
);

export const DEMO_VIOLATIONS: Tables<"violations">[] = [
  {
    id: "demo-violation-101",
    ticket_number: "OVS-2026-000101",
    violator_name: "Juan Dela Cruz",
    address: "Bajada, Davao City",
    license_number: "N01-23-456789",
    vehicle_plate: "LAB 2841",
    violation_type: "Disregarding Traffic Signs",
    ordinance_code: "Ord. 1557-11 Sec. 12",
    fine_amount: 1000,
    location: "Quirino Ave. cor. Bonifacio St.",
    issued_at: "2026-08-22T09:15:00.000Z",
    officer: "PO2 R. Mendoza",
    remarks: null,
    status: "unpaid",
    created_by: "demo-staff",
    created_at: "2026-08-22T09:15:00.000Z",
    updated_at: "2026-08-22T09:15:00.000Z",
  },
  {
    id: "demo-violation-102",
    ticket_number: "OVS-2026-000102",
    violator_name: "Maria Santos",
    address: "Matina, Davao City",
    license_number: "N02-11-998877",
    vehicle_plate: "ABC 1122",
    violation_type: "No Helmet (Driver)",
    ordinance_code: "Ord. 0300-07 Sec. 5",
    fine_amount: 500,
    location: "McArthur Hwy, Matina Crossing",
    issued_at: "2026-08-20T14:30:00.000Z",
    officer: "PO1 J. Lim",
    remarks: null,
    status: "paid",
    created_by: "demo-staff",
    created_at: "2026-08-20T14:30:00.000Z",
    updated_at: "2026-08-20T14:30:00.000Z",
  },
  {
    id: "demo-violation-103",
    ticket_number: "OVS-2026-000103",
    violator_name: "Pedro Reyes",
    address: "Toril, Davao City",
    license_number: "N03-45-112233",
    vehicle_plate: "XYZ 7788",
    violation_type: "Illegal Parking",
    ordinance_code: "Ord. 1557-11 Sec. 22",
    fine_amount: 1500,
    location: "Toril Public Market",
    issued_at: "2026-08-24T08:05:00.000Z",
    officer: "PO3 A. Cruz",
    remarks: null,
    status: "unpaid",
    created_by: "demo-staff",
    created_at: "2026-08-24T08:05:00.000Z",
    updated_at: "2026-08-24T08:05:00.000Z",
  },
  {
    id: "demo-violation-104",
    ticket_number: "OVS-2026-000104",
    violator_name: "Ana Lorenzo",
    address: "Buhangin, Davao City",
    license_number: "N04-77-334455",
    vehicle_plate: "DEF 9021",
    violation_type: "Anti-Smoking Ordinance",
    ordinance_code: "Ord. 0367-12 Sec. 4",
    fine_amount: 500,
    location: "Buhangin Terminal",
    issued_at: "2026-08-16T11:40:00.000Z",
    officer: "Enf. M. Villar",
    remarks: null,
    status: "paid",
    created_by: "demo-staff",
    created_at: "2026-08-16T11:40:00.000Z",
    updated_at: "2026-08-16T11:40:00.000Z",
  },
  {
    id: "demo-violation-105",
    ticket_number: "OVS-2026-000105",
    violator_name: "Carlo Bautista",
    address: "Agdao, Davao City",
    license_number: "N05-19-556677",
    vehicle_plate: "GHI 3345",
    violation_type: "Obstruction of Sidewalk",
    ordinance_code: "Ord. 1557-11 Sec. 31",
    fine_amount: 2000,
    location: "Agdao Public Market",
    issued_at: "2026-08-25T07:50:00.000Z",
    officer: "Enf. D. Sanchez",
    remarks: "Vendor cart occupying the pedestrian lane.",
    status: "unpaid",
    created_by: "demo-staff",
    created_at: "2026-08-25T07:50:00.000Z",
    updated_at: "2026-08-25T07:50:00.000Z",
  },
  {
    id: "demo-violation-106",
    ticket_number: "OVS-2026-000106",
    violator_name: "Liza Ramos",
    address: "Talomo, Davao City",
    license_number: "N06-33-778899",
    vehicle_plate: "JKL 5567",
    violation_type: "Overloading",
    ordinance_code: "Ord. 1557-11 Sec. 18",
    fine_amount: 1000,
    location: "Ulas Junction",
    issued_at: "2026-08-19T16:20:00.000Z",
    officer: "PO2 R. Mendoza",
    remarks: "Case under review by the hearing officer.",
    status: "contested",
    created_by: "demo-staff",
    created_at: "2026-08-19T16:20:00.000Z",
    updated_at: "2026-08-20T09:00:00.000Z",
  },
  {
    id: "demo-violation-107",
    ticket_number: "OVS-2026-000107",
    violator_name: "Miguel Torres",
    address: "Mintal, Davao City",
    license_number: "N07-88-223344",
    vehicle_plate: "MNO 7789",
    violation_type: "Anti-Littering",
    ordinance_code: "Ord. 0361-12 Sec. 3",
    fine_amount: 300,
    location: "Mintal Diversion Rd.",
    issued_at: "2026-08-18T10:05:00.000Z",
    officer: "Enf. K. Uy",
    remarks: null,
    status: "unpaid",
    created_by: "demo-staff",
    created_at: "2026-08-18T10:05:00.000Z",
    updated_at: "2026-08-18T10:05:00.000Z",
  },
  {
    id: "demo-violation-108",
    ticket_number: "OVS-2026-000108",
    violator_name: "Grace Alcantara",
    address: "Lanang, Davao City",
    license_number: "N08-55-667788",
    vehicle_plate: "PQR 1123",
    violation_type: "Beating the Red Light",
    ordinance_code: "Ord. 1557-11 Sec. 9",
    fine_amount: 1000,
    location: "JP Laurel Ave., Lanang",
    issued_at: "2026-08-23T13:10:00.000Z",
    officer: "PO1 J. Lim",
    remarks: null,
    status: "paid",
    created_by: "demo-staff",
    created_at: "2026-08-23T13:10:00.000Z",
    updated_at: "2026-08-23T13:25:00.000Z",
  },
  {
    id: "demo-violation-109",
    ticket_number: "OVS-2026-000109",
    violator_name: "Roberto Villanueva",
    address: "Sasa, Davao City",
    license_number: "N09-62-445566",
    vehicle_plate: "STU 6612",
    violation_type: "No Parking in Loading Zone",
    ordinance_code: "Ord. 1557-11 Sec. 25",
    fine_amount: 1200,
    location: "Sasa Wharf Road",
    issued_at: "2026-08-21T09:40:00.000Z",
    officer: "Enf. M. Villar",
    remarks: null,
    status: "paid",
    created_by: "demo-staff",
    created_at: "2026-08-21T09:40:00.000Z",
    updated_at: "2026-08-21T10:05:00.000Z",
  },
  {
    id: "demo-violation-110",
    ticket_number: "OVS-2026-000110",
    violator_name: "Sofia Mercado",
    address: "Calinan, Davao City",
    license_number: "N10-72-889900",
    vehicle_plate: "VWX 4477",
    violation_type: "Noise Disturbance",
    ordinance_code: "Ord. 0367-12 Sec. 8",
    fine_amount: 800,
    location: "Calinan Town Center",
    issued_at: "2026-08-15T20:25:00.000Z",
    officer: "PO3 A. Cruz",
    remarks: "Cancelled after duplicate citation review.",
    status: "cancelled",
    created_by: "demo-staff",
    created_at: "2026-08-15T20:25:00.000Z",
    updated_at: "2026-08-16T08:30:00.000Z",
  },
];

export const DEMO_PAYMENTS: Tables<"payments">[] = [
  {
    id: "demo-payment-102",
    violation_id: "demo-violation-102",
    amount: 500,
    channel: "GCash",
    reference: "REF-2026-000102",
    payer_email: DEMO_CITIZEN.email,
    status: "completed",
    paid_at: "2026-08-20T14:45:00.000Z",
  },
  {
    id: "demo-payment-104",
    violation_id: "demo-violation-104",
    amount: 500,
    channel: "Maya",
    reference: "REF-2026-000104",
    payer_email: "payer@example.com",
    status: "completed",
    paid_at: "2026-08-16T12:05:00.000Z",
  },
  {
    id: "demo-payment-108",
    violation_id: "demo-violation-108",
    amount: 1000,
    channel: "Maya",
    reference: "REF-2026-000108",
    payer_email: "payer@example.com",
    status: "completed",
    paid_at: "2026-08-23T13:25:00.000Z",
  },
  {
    id: "demo-payment-109",
    violation_id: "demo-violation-109",
    amount: 1200,
    channel: "GCash",
    reference: "REF-2026-000109",
    payer_email: DEMO_CITIZEN.email,
    status: "completed",
    paid_at: "2026-08-21T10:05:00.000Z",
  },
];

export const DEMO_CITIZEN_PAYMENTS: CitizenPayment[] = [
  {
    reference: "REF-2026-000102",
    amount: 500,
    channel: "GCash",
    status: "completed",
    paidAt: "2026-08-20T14:45:00.000Z",
    ticketNumber: "OVS-2026-000102",
    violationType: "No Helmet (Driver)",
  },
  {
    reference: "REF-2026-000109",
    amount: 1200,
    channel: "GCash",
    status: "completed",
    paidAt: "2026-08-21T10:05:00.000Z",
    ticketNumber: "OVS-2026-000109",
    violationType: "No Parking in Loading Zone",
  },
];
