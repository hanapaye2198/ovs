const API_URL = (import.meta.env["VITE_API_URL"] ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export type StaffRole = "admin" | "encoder" | "viewer";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: StaffRole | null;
  contact_number: string | null;
  created_at: string;
};

export type AuthSession = {
  token: string;
  user: ApiUser;
};

const STAFF_TOKEN_KEY = "ovs-staff-token";
const STAFF_USER_KEY = "ovs-staff-user";
const CITIZEN_TOKEN_KEY = "ovs-citizen-token";
const CITIZEN_USER_KEY = "ovs-citizen-user";

export const STAFF_AUTH_EVENT = "ovs-staff-auth-change";
export const CITIZEN_AUTH_EVENT = "ovs-citizen-auth-change";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

type ErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

function errorMessage(payload: ErrorPayload) {
  const first = payload.errors ? Object.values(payload.errors).flat()[0] : undefined;
  return first || payload.message || "Request failed.";
}

export type PublicTicket = {
  ticket_number: string;
  violator_name: string;
  violation_type: string;
  ordinance_code: string | null;
  fine_amount: number;
  location: string | null;
  issued_at: string;
  status: string;
  vehicle_plate: string | null;
};

export type CitizenPayment = {
  reference: string;
  amount: number;
  channel: string;
  status: string;
  paidAt: string;
  ticketNumber: string;
  violationType: string;
};

export type SettlementReceipt = {
  reference: string;
  amount: number;
  channel: string;
  ticketNumber: string;
  paidAt: string;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

export function readStaffSession(): AuthSession | null {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem(STAFF_TOKEN_KEY);
  const user = readJson<ApiUser>(STAFF_USER_KEY);
  if (!token || !user?.role) return null;
  return { token, user };
}

export function readCitizenSession(): AuthSession | null {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem(CITIZEN_TOKEN_KEY);
  const user = readJson<ApiUser>(CITIZEN_USER_KEY);
  if (!token || !user) return null;
  return { token, user };
}

function saveSession(audience: "staff" | "citizen", session: AuthSession) {
  const tokenKey = audience === "staff" ? STAFF_TOKEN_KEY : CITIZEN_TOKEN_KEY;
  const userKey = audience === "staff" ? STAFF_USER_KEY : CITIZEN_USER_KEY;
  window.localStorage.setItem(tokenKey, session.token);
  window.localStorage.setItem(userKey, JSON.stringify(session.user));
  window.dispatchEvent(
    new Event(audience === "staff" ? STAFF_AUTH_EVENT : CITIZEN_AUTH_EVENT),
  );
}

export function clearStaffSession() {
  window.localStorage.removeItem(STAFF_TOKEN_KEY);
  window.localStorage.removeItem(STAFF_USER_KEY);
  window.dispatchEvent(new Event(STAFF_AUTH_EVENT));
}

export function clearCitizenSession() {
  window.localStorage.removeItem(CITIZEN_TOKEN_KEY);
  window.localStorage.removeItem(CITIZEN_USER_KEY);
  window.dispatchEvent(new Event(CITIZEN_AUTH_EVENT));
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
  };
  if (options.body !== undefined) init.body = JSON.stringify(options.body);

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}`, init);
  } catch {
    throw new ApiError("Cannot reach the Laravel API. Start it with php artisan serve in the backend folder.");
  }

  const payload = (await response.json().catch(() => ({}))) as ErrorPayload;
  if (!response.ok) {
    throw new ApiError(errorMessage(payload));
  }
  return payload as T;
}

export async function login(email: string, password: string, audience: "staff" | "citizen") {
  const session = await request<AuthSession>("/auth/login", {
    method: "POST",
    body: { email, password, audience },
  });
  saveSession(audience, session);
  return session;
}

export async function registerCitizen(input: { fullName: string; email: string; password: string }) {
  const session = await request<AuthSession>("/auth/register", {
    method: "POST",
    body: {
      full_name: input.fullName,
      email: input.email,
      password: input.password,
    },
  });
  saveSession("citizen", session);
  return session;
}

export async function logout(audience: "staff" | "citizen") {
  const session = audience === "staff" ? readStaffSession() : readCitizenSession();
  if (session) {
    try {
      await request("/auth/logout", { method: "POST", token: session.token });
    } catch {
      // The local session is cleared even if the API is unavailable.
    }
  }
  if (audience === "staff") clearStaffSession();
  else clearCitizenSession();
}

export async function lookupTicket(ticketNumber: string) {
  return request<{ ticket: PublicTicket | null }>("/tickets/lookup", {
    method: "POST",
    body: { ticket_number: ticketNumber },
  });
}

export async function lookupByPlate(vehiclePlate: string, mvFileNumber: string) {
  return request<{ tickets: PublicTicket[] }>("/tickets/by-plate", {
    method: "POST",
    body: { vehicle_plate: vehiclePlate, mv_file_number: mvFileNumber },
  });
}

export async function settleTicket(input: { ticketNumber: string; channel: string; email: string }) {
  return request<SettlementReceipt>("/tickets/settle", {
    method: "POST",
    body: {
      ticket_number: input.ticketNumber,
      channel: input.channel,
      email: input.email,
    },
  });
}

export async function getCitizenPayments() {
  const session = readCitizenSession();
  if (!session) throw new ApiError("Sign in to view your payments.");
  return request<{ payments: CitizenPayment[] }>("/citizen/payments", {
    token: session.token,
  });
}

export async function getCitizenTickets() {
  const session = readCitizenSession();
  if (!session) throw new ApiError("Sign in to view your tickets.");
  return request<{ tickets: PublicTicket[] }>("/citizen/tickets", {
    token: session.token,
  });
}

export type StaffViolation = {
  id: string;
  ticket_number: string;
  violator_name: string;
  address: string | null;
  license_number: string | null;
  vehicle_plate: string | null;
  mv_file_number: string | null;
  citizen_email: string | null;
  violation_type: string;
  ordinance_code: string | null;
  fine_amount: number;
  location: string | null;
  issued_at: string;
  officer: string | null;
  remarks: string | null;
  status: "unpaid" | "paid" | "contested" | "cancelled";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffPayment = {
  id: string;
  violation_id: string;
  amount: number;
  channel: string;
  reference: string;
  payer_email: string | null;
  status: string;
  paid_at: string;
};

function staffToken() {
  const session = readStaffSession();
  if (!session) throw new ApiError("Sign in as LGU staff to continue.");
  return session.token;
}

export type SupportRequestRecord = {
  id: string;
  name: string;
  email: string;
  ticket_number: string | null;
  topic: string;
  message: string;
  created_at: string;
};

export type StaffAccount = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
};

export async function getDashboard() {
  return request<{
    violations: StaffViolation[];
    payments: StaffPayment[];
    support_requests: SupportRequestRecord[];
  }>("/staff/dashboard", {
    token: staffToken(),
  });
}

export async function listStaffUsers() {
  return request<{ users: StaffAccount[] }>("/staff/users", { token: staffToken() });
}

export async function createStaffUser(body: {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
}) {
  return request<{ user: StaffAccount }>("/staff/users", {
    method: "POST",
    token: staffToken(),
    body,
  });
}

export async function createViolation(body: Record<string, unknown>) {
  return request<{ violation: StaffViolation }>("/staff/violations", {
    method: "POST",
    token: staffToken(),
    body,
  });
}

export async function updateViolation(id: string, body: Record<string, unknown>) {
  return request<{ violation: StaffViolation }>(`/staff/violations/${id}`, {
    method: "PATCH",
    token: staffToken(),
    body,
  });
}

export async function deleteViolation(id: string) {
  return request<{ message: string }>(`/staff/violations/${id}`, {
    method: "DELETE",
    token: staffToken(),
  });
}

export async function resetRecords() {
  return request<{ message: string }>("/staff/reset", {
    method: "POST",
    token: staffToken(),
  });
}

export async function submitSupportRequest(body: {
  name: string;
  email: string;
  ticketNumber: string;
  topic: string;
  message: string;
}) {
  return request<{ id: string; message: string }>("/support", {
    method: "POST",
    body: {
      name: body.name,
      email: body.email,
      ticket_number: body.ticketNumber,
      topic: body.topic,
      message: body.message,
    },
  });
}
