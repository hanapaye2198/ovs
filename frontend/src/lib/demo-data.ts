/** Shortcut buttons for the seeded Laravel accounts. Login still goes through the API. */
export const DEMO_MODE = true;

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

export const DEMO_CITIZEN = {
  email: "citizen@ovs.demo",
  password: "demo1234",
  fullName: "Demo Citizen",
};
