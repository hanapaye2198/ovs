import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardPlus,
  CircleDollarSign,
  FileSearch,
  LogOut,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  Trash2,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  clearDemoStaffSession,
  DEMO_MODE,
  DEMO_PAYMENTS,
  DEMO_PAYMENTS_STORAGE_KEY,
  DEMO_STAFF_ACCOUNTS,
  DEMO_VIOLATIONS,
  DEMO_VIOLATIONS_STORAGE_KEY,
  readDemoStaffSession,
} from "@/lib/demo-data";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "LGU Dashboard | OVS" },
      {
        name: "description",
        content:
          "Review ordinance violations, payments, and ticket trends from the OVS LGU dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

type Violation = Tables<"violations">;
type Payment = Tables<"payments">;
type AppRole = Database["public"]["Enums"]["app_role"];
type TrendPoint = {
  key: string;
  label: string;
  tickets: number;
  paid: number;
  collected: number;
};

const emptyForm = {
  ticketNumber: "",
  violatorName: "",
  violationType: "",
  ordinanceCode: "",
  fineAmount: "",
  location: "",
  vehiclePlate: "",
  officer: "",
  status: "unpaid" as Violation["status"],
};

const rolePageContent: Record<
  AppRole,
  {
    eyebrow: string;
    title: string;
    description: string;
    workspaceTitle: string;
    workspaceText: string;
  }
> = {
  admin: {
    eyebrow: "Administrator workspace",
    title: "Control the whole OVS operation.",
    description: "Review collections, manage violation records, and keep staff access organized.",
    workspaceTitle: "Administrative control center",
    workspaceText: "This role can manage records and oversee every staff workspace in the demo.",
  },
  encoder: {
    eyebrow: "Encoder workspace",
    title: "Keep field records moving.",
    description: "Encode new citations, update case details, and keep ticket information accurate.",
    workspaceTitle: "Encoding queue",
    workspaceText:
      "This role can create and update violation records, but does not manage staff access.",
  },
  viewer: {
    eyebrow: "Viewer workspace",
    title: "See the full picture clearly.",
    description:
      "Search violations, monitor payment status, and review collection activity securely.",
    workspaceTitle: "Read-only review",
    workspaceText:
      "This role can view records and payments. Editing controls are intentionally disabled.",
  },
};

function readDemoRows<T>(key: string, fallback: T[]) {
  const stored = window.localStorage.getItem(key);
  if (!stored) return [...fallback];

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as T[]) : [...fallback];
  } catch {
    return [...fallback];
  }
}

function writeDemoRows<T>(key: string, rows: T[]) {
  window.localStorage.setItem(key, JSON.stringify(rows));
}

function toUtcDay(value: string | null | undefined) {
  const timestamp = Date.parse(value ?? "");
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : null;
}

function readViolationDraft(formElement: HTMLFormElement): typeof emptyForm {
  const data = new FormData(formElement);
  const read = (key: string) => String(data.get(key) ?? "");
  return {
    ticketNumber: read("ticketNumber"),
    violatorName: read("violatorName"),
    violationType: read("violationType"),
    ordinanceCode: read("ordinanceCode"),
    fineAmount: read("fineAmount"),
    location: read("location"),
    vehiclePlate: read("vehiclePlate"),
    officer: read("officer"),
    status: read("status") as Violation["status"],
  };
}

function Dashboard() {
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<AppRole | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingViolation, setEditingViolation] = useState<Violation | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [authResolved, setAuthResolved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const demoInitialized = useRef(false);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    if (DEMO_MODE) {
      if (!demoInitialized.current) {
        setViolations(readDemoRows(DEMO_VIOLATIONS_STORAGE_KEY, DEMO_VIOLATIONS));
        setPayments(readDemoRows(DEMO_PAYMENTS_STORAGE_KEY, DEMO_PAYMENTS));
        demoInitialized.current = true;
      }
      setLastUpdated(new Date().toISOString());
      setLiveConnected(true);
      setLoading(false);
      return;
    }
    const [
      { data: violationRows, error: violationError },
      { data: paymentRows, error: paymentError },
    ] = await Promise.all([
      supabase.from("violations").select("*").order("issued_at", { ascending: false }),
      supabase.from("payments").select("*").order("paid_at", { ascending: false }),
    ]);

    if (violationError || paymentError) {
      setError(violationError?.message ?? paymentError?.message ?? "Unable to load the dashboard.");
    } else {
      setViolations(violationRows ?? []);
      setPayments(paymentRows ?? []);
      setLastUpdated(new Date().toISOString());
    }
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    let liveChannel: ReturnType<typeof supabase.channel> | null = null;
    if (DEMO_MODE) {
      const demoSession = readDemoStaffSession();
      if (!demoSession) {
        setLoading(false);
        setAuthResolved(true);
        return () => {
          active = false;
          setLiveConnected(false);
        };
      }
      setUserId("demo-staff");
      setUserEmail(demoSession.email);
      setRole(demoSession.role);
      setAuthResolved(true);
      void loadDashboard();
      return () => {
        active = false;
        setLiveConnected(false);
      };
    }
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) {
        setLoading(false);
        setAuthResolved(true);
        return;
      }
      setUserId(data.user.id);
      setUserEmail(data.user.email ?? "");
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .then(({ data: roleRows, error: roleError }) => {
          if (!active) return;
          const assignedRole = roleRows?.[0]?.role ?? null;
          setRole(assignedRole);
          setAuthResolved(true);
          if (roleError || !assignedRole) {
            setError(
              "Your account is signed in, but it has not been assigned an LGU staff role yet.",
            );
            setLoading(false);
            return;
          }
          void loadDashboard();
          liveChannel = supabase
            .channel(`lgu-dashboard-${data.user.id}`)
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "violations" },
              () => void loadDashboard(),
            )
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "payments" },
              () => void loadDashboard(),
            )
            .subscribe((status) => {
              if (!active) return;
              setLiveConnected(status === "SUBSCRIBED");
            });
        });
    });
    return () => {
      active = false;
      setLiveConnected(false);
      if (liveChannel) void supabase.removeChannel(liveChannel);
    };
  }, []);

  const filteredViolations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return violations.filter((violation) => {
      const matchesStatus = statusFilter === "all" || violation.status === statusFilter;
      const matchesQuery =
        !normalized ||
        [
          violation.ticket_number,
          violation.violator_name,
          violation.violation_type,
          violation.vehicle_plate ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, violations]);

  const stats = useMemo(() => {
    const paid = violations.filter((item) => item.status === "paid");
    const unpaid = violations.filter((item) => item.status === "unpaid");
    return {
      total: violations.length,
      paid: paid.length,
      unpaid: unpaid.length,
      collected: paid.reduce((total, item) => total + Number(item.fine_amount), 0),
      outstanding: unpaid.reduce((total, item) => total + Number(item.fine_amount), 0),
    };
  }, [violations]);

  const trends = useMemo<TrendPoint[]>(() => {
    const timestamps = [
      ...violations.map((item) => Date.parse(item.issued_at)),
      ...payments.map((item) => Date.parse(item.paid_at)),
    ].filter((timestamp) => Number.isFinite(timestamp));
    const latestTimestamp = timestamps.length ? Math.max(...timestamps) : Date.now();
    const endDate = new Date(latestTimestamp);
    endDate.setUTCHours(0, 0, 0, 0);
    const labelFormatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(endDate);
      date.setUTCDate(endDate.getUTCDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const dayPayments = payments.filter(
        (payment) => toUtcDay(payment.paid_at) === key && payment.status === "completed",
      );

      return {
        key,
        label: labelFormatter.format(date),
        tickets: violations.filter((violation) => toUtcDay(violation.issued_at) === key).length,
        paid: dayPayments.length,
        collected: dayPayments.reduce((total, payment) => total + Number(payment.amount), 0),
      };
    });
  }, [payments, violations]);

  async function handleSignOut() {
    if (DEMO_MODE) {
      clearDemoStaffSession();
      window.location.assign("/auth");
      return;
    }

    await supabase.auth.signOut();
    window.location.assign("/auth");
  }

  function handleResetDemoData() {
    if (!DEMO_MODE || !window.confirm("Reset all demo records to the original seed data?")) return;

    window.localStorage.removeItem(DEMO_VIOLATIONS_STORAGE_KEY);
    window.localStorage.removeItem(DEMO_PAYMENTS_STORAGE_KEY);
    setViolations([...DEMO_VIOLATIONS]);
    setPayments([...DEMO_PAYMENTS]);
    demoInitialized.current = true;
    setNotice("Demo records reset to the original seed data.");
    setError("");
  }

  async function handleDeleteViolation(violation: Violation) {
    if (role !== "admin") return;
    if (!window.confirm(`Delete ${violation.ticket_number}? This cannot be undone in the demo.`)) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    if (DEMO_MODE) {
      const nextViolations = violations.filter((item) => item.id !== violation.id);
      const nextPayments = payments.filter((item) => item.violation_id !== violation.id);
      setViolations(nextViolations);
      setPayments(nextPayments);
      writeDemoRows(DEMO_VIOLATIONS_STORAGE_KEY, nextViolations);
      writeDemoRows(DEMO_PAYMENTS_STORAGE_KEY, nextPayments);
      setNotice(`${violation.ticket_number} deleted from the demo records.`);
      setBusy(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("violations")
      .delete()
      .eq("id", violation.id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setNotice(`${violation.ticket_number} deleted.`);
      await loadDashboard();
    }
    setBusy(false);
  }

  async function handleAddViolation(draft: typeof emptyForm) {
    setBusy(true);
    setError("");
    setNotice("");

    if (DEMO_MODE) {
      const now = new Date().toISOString();
      const demoViolation: Violation = {
        id: `demo-violation-${Date.now()}`,
        ticket_number: draft.ticketNumber.trim().toUpperCase(),
        violator_name: draft.violatorName.trim(),
        address: null,
        license_number: null,
        vehicle_plate: draft.vehiclePlate.trim() || null,
        violation_type: draft.violationType.trim(),
        ordinance_code: draft.ordinanceCode.trim() || null,
        fine_amount: Number(draft.fineAmount),
        location: draft.location.trim() || null,
        issued_at: now,
        officer: draft.officer.trim() || null,
        remarks: null,
        status: draft.status,
        created_by: "demo-staff",
        created_at: now,
        updated_at: now,
      };
      const nextViolations = [demoViolation, ...violations];
      setViolations(nextViolations);
      writeDemoRows(DEMO_VIOLATIONS_STORAGE_KEY, nextViolations);
      setNotice("Demo violation added to the dashboard.");
      setForm(emptyForm);
      setShowAdd(false);
      setBusy(false);
      return;
    }

    const { error: insertError } = await supabase.from("violations").insert({
      ticket_number: draft.ticketNumber.trim().toUpperCase(),
      violator_name: draft.violatorName.trim(),
      violation_type: draft.violationType.trim(),
      ordinance_code: draft.ordinanceCode.trim() || null,
      fine_amount: Number(draft.fineAmount),
      location: draft.location.trim() || null,
      vehicle_plate: draft.vehiclePlate.trim() || null,
      officer: draft.officer.trim() || null,
      created_by: userId,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setNotice("Violation added to the dashboard.");
      setForm(emptyForm);
      setShowAdd(false);
      await loadDashboard();
    }
    setBusy(false);
  }

  async function handleSaveViolation(draft: typeof emptyForm) {
    setBusy(true);
    setError("");
    setNotice("");

    const payload = {
      ticket_number: draft.ticketNumber.trim().toUpperCase(),
      violator_name: draft.violatorName.trim(),
      violation_type: draft.violationType.trim(),
      ordinance_code: draft.ordinanceCode.trim() || null,
      fine_amount: Number(draft.fineAmount),
      location: draft.location.trim() || null,
      vehicle_plate: draft.vehiclePlate.trim() || null,
      officer: draft.officer.trim() || null,
      status: draft.status,
    };

    if (DEMO_MODE && editingViolation) {
      const now = new Date().toISOString();
      const nextViolations = violations.map((violation) =>
        violation.id === editingViolation.id
          ? {
              ...violation,
              ticket_number: payload.ticket_number,
              violator_name: payload.violator_name,
              violation_type: payload.violation_type,
              ordinance_code: payload.ordinance_code,
              fine_amount: payload.fine_amount,
              location: payload.location,
              vehicle_plate: payload.vehicle_plate,
              officer: payload.officer,
              status: payload.status,
              updated_at: now,
            }
          : violation,
      );
      setViolations(nextViolations);
      writeDemoRows(DEMO_VIOLATIONS_STORAGE_KEY, nextViolations);
      setNotice("Demo violation details updated.");
      closeEditor();
      setBusy(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("violations")
      .update(payload)
      .eq("id", editingViolation?.id ?? "");

    if (updateError) {
      setError(updateError.message);
    } else {
      setNotice("Violation details updated.");
      closeEditor();
      await loadDashboard();
    }
    setBusy(false);
  }

  function openEditor(violation: Violation) {
    setEditingViolation(violation);
    setShowAdd(true);
    setForm({
      ticketNumber: violation.ticket_number,
      violatorName: violation.violator_name,
      violationType: violation.violation_type,
      ordinanceCode: violation.ordinance_code ?? "",
      fineAmount: String(violation.fine_amount),
      location: violation.location ?? "",
      vehiclePlate: violation.vehicle_plate ?? "",
      officer: violation.officer ?? "",
      status: violation.status,
    });
  }

  function closeEditor() {
    setShowAdd(false);
    setEditingViolation(null);
    setForm(emptyForm);
  }

  function openNewViolation() {
    setEditingViolation(null);
    setForm(emptyForm);
    setShowAdd(true);
  }

  useEffect(() => {
    if (!showAdd) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById("add-violation-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [editingViolation?.id, showAdd]);

  const canManage = role === "admin" || role === "encoder";
  const activeRole = role ?? "viewer";
  const rolePage = rolePageContent[activeRole];

  if (!userId && authResolved) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center px-4 py-14">
        <section className="surface-panel w-full p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="text-display mt-5 text-3xl font-bold">Staff sign-in required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in with an authorized LGU account to open the violation management dashboard.
          </p>
          <Button asChild className="mt-6">
            <Link to="/auth">
              Go to staff login <ArrowRight />
            </Link>
          </Button>
        </section>
      </div>
    );
  }

  if (userId && authResolved && !role) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center px-4 py-14">
        <section className="surface-panel w-full p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="text-display mt-5 text-3xl font-bold">Role assignment needed</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your account is valid, but an administrator still needs to assign an LGU portal role
            before you can view violation records.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => void handleSignOut()}>
            <LogOut /> Sign out
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:py-12">
      <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <ShieldCheck className="size-3.5" /> {rolePage.eyebrow}
          </span>
          <h1 className="text-display mt-4 text-4xl font-bold sm:text-5xl">{rolePage.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{rolePage.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${
                liveConnected
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-secondary/50"
              }`}
            >
              <Radio className="size-3.5" />
              {DEMO_MODE
                ? "Demo live preview"
                : liveConnected
                  ? "Live updates on"
                  : "Connecting to live updates"}
            </span>
            {lastUpdated ? <span>Last synced {formatDate(lastUpdated)}</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-muted-foreground">
            {userEmail} · <span className="font-semibold capitalize text-foreground">{role}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadDashboard()}
            disabled={loading}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
          {DEMO_MODE && activeRole === "admin" ? (
            <Button variant="outline" size="sm" onClick={handleResetDemoData}>
              Reset demo
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => void handleSignOut()}>
            <LogOut /> Sign out
          </Button>
        </div>
      </header>

      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      {notice ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={Ticket}
          label="Total tickets"
          value={String(stats.total)}
          hint="All recorded violations"
        />
        <StatCard
          icon={ClockIcon}
          label="Unpaid"
          value={String(stats.unpaid)}
          hint={formatCurrency(stats.outstanding) + " outstanding"}
        />
        <StatCard
          icon={CheckCircle2}
          label="Paid"
          value={String(stats.paid)}
          hint="Settled tickets"
          tone="success"
        />
        <StatCard
          icon={WalletCards}
          label="Collected"
          value={formatCurrency(stats.collected)}
          hint="Recorded payments"
          tone="accent"
        />
        <StatCard
          icon={TrendingUp}
          label="Payment records"
          value={String(payments.length)}
          hint="Gateway transactions"
        />
      </div>

      <RoleWorkspace
        role={activeRole}
        title={rolePage.workspaceTitle}
        text={rolePage.workspaceText}
        onAdd={openNewViolation}
      />

      <TrendPanel trends={trends} />

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.37fr]">
        <div className="surface-panel overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">All violators</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Search by ticket, name, violation, or plate.
              </p>
            </div>
            <Button
              onClick={() => (showAdd ? closeEditor() : openNewViolation())}
              disabled={!canManage}
            >
              <Plus /> Add violator
            </Button>
          </div>
          <div className="flex flex-col gap-3 border-b border-border bg-secondary/30 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search records…"
                className="pl-9 bg-background"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="contested">Contested</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-secondary/25 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Ticket</th>
                  <th className="px-5 py-3 font-semibold">Violator</th>
                  <th className="px-5 py-3 font-semibold">Violation</th>
                  <th className="px-5 py-3 font-semibold">Issued</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      Loading violation records…
                    </td>
                  </tr>
                ) : null}
                {!loading && filteredViolations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      No records match your search.
                    </td>
                  </tr>
                ) : null}
                {!loading
                  ? filteredViolations.map((violation) => (
                      <ViolationRow
                        key={violation.id}
                        violation={violation}
                        canManage={canManage}
                        canDelete={activeRole === "admin"}
                        onEdit={openEditor}
                        onDelete={handleDeleteViolation}
                      />
                    ))
                  : null}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Showing {filteredViolations.length} of {violations.length} tickets
          </div>
        </div>

        {showAdd ? (
          <AddViolationForm
            id="add-violation-form"
            key={editingViolation?.id ?? "new"}
            form={form}
            onSubmit={editingViolation ? handleSaveViolation : handleAddViolation}
            onClose={closeEditor}
            busy={busy}
            editing={Boolean(editingViolation)}
          />
        ) : (
          <QuickGuide onAdd={openNewViolation} canManage={canManage} />
        )}
      </section>

      <PaymentHistory payments={payments} violations={violations} />
    </div>
  );
}

function TrendPanel({ trends }: { trends: TrendPoint[] }) {
  const activityMax = Math.max(1, ...trends.map((point) => Math.max(point.tickets, point.paid)));
  const collectionMax = Math.max(1, ...trends.map((point) => point.collected));
  const summary = trends.reduce(
    (totals, point) => ({
      tickets: totals.tickets + point.tickets,
      paid: totals.paid + point.paid,
      collected: totals.collected + point.collected,
    }),
    { tickets: 0, paid: 0, collected: 0 },
  );
  const collectionRate = summary.tickets ? Math.round((summary.paid / summary.tickets) * 100) : 0;

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
      <div className="surface-panel min-w-0 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <TrendingUp className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Violation and collection trends</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Seven-day activity from encoded tickets and completed payments.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" /> Tickets
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-success" /> Paid
            </span>
          </div>
        </div>

        <div
          className="mt-8 grid grid-cols-7 gap-2 sm:gap-4"
          aria-label="Seven-day violation trend"
        >
          {trends.map((point) => {
            const ticketHeight = point.tickets
              ? Math.max(12, (point.tickets / activityMax) * 100)
              : 0;
            const paidHeight = point.paid ? Math.max(12, (point.paid / activityMax) * 100) : 0;

            return (
              <div key={point.key} className="min-w-0 text-center">
                <div className="flex h-44 items-end justify-center gap-1 border-b border-border pb-2">
                  <div
                    className="w-1/2 max-w-5 rounded-t bg-primary/80 transition-all"
                    style={{ height: `${ticketHeight}%` }}
                    title={`${point.tickets} ticket${point.tickets === 1 ? "" : "s"}`}
                  />
                  <div
                    className="w-1/2 max-w-5 rounded-t bg-success transition-all"
                    style={{ height: `${paidHeight}%` }}
                    title={`${point.paid} paid payment${point.paid === 1 ? "" : "s"}`}
                  />
                </div>
                <p className="mt-2 truncate text-[11px] font-medium text-muted-foreground">
                  {point.label}
                </p>
                <p className="mt-1 text-xs font-semibold">
                  {point.tickets} <span className="text-muted-foreground">/ {point.paid}</span>
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Tickets / completed payments</p>
      </div>

      <div className="surface-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Collection pulse</h2>
            <p className="mt-1 text-sm text-muted-foreground">Last seven days at a glance.</p>
          </div>
          <Badge variant="secondary">{collectionRate}% settled</Badge>
        </div>
        <div className="mt-7 space-y-5">
          <TrendMetric
            label="Tickets issued"
            value={String(summary.tickets)}
            percent={summary.tickets ? 100 : 0}
          />
          <TrendMetric
            label="Payments completed"
            value={String(summary.paid)}
            percent={summary.tickets ? Math.min(100, (summary.paid / summary.tickets) * 100) : 0}
            tone="success"
          />
          <TrendMetric
            label="Collected"
            value={formatCurrency(summary.collected)}
            percent={(summary.collected / collectionMax) * 100}
            tone="accent"
          />
        </div>
        <div className="mt-7 rounded-lg bg-secondary/60 p-4 text-sm">
          <p className="font-semibold">Demo data stays live</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Add, edit, or delete a ticket and the trend bars and collection summary update with it.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrendMetric({
  label,
  value,
  percent,
  tone = "primary",
}: {
  label: string;
  value: string;
  percent: number;
  tone?: "primary" | "success" | "accent";
}) {
  const barClass =
    tone === "success" ? "bg-success" : tone === "accent" ? "bg-accent" : "bg-primary";

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

function RoleWorkspace({
  role,
  title,
  text,
  onAdd,
}: {
  role: AppRole;
  title: string;
  text: string;
  onAdd: () => void;
}) {
  if (role === "admin") {
    return (
      <section className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="surface-panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <h2 className="mt-4 text-xl font-semibold">{title}</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">{text}</p>
            </div>
            <Badge>Full access</Badge>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-secondary/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Staff roles
              </p>
              <p className="mt-2 text-2xl font-bold">3</p>
              <p className="mt-1 text-xs text-muted-foreground">Configured workspaces</p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Record control
              </p>
              <p className="mt-2 text-2xl font-bold">On</p>
              <p className="mt-1 text-xs text-muted-foreground">Create and update access</p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Live status
              </p>
              <p className="mt-2 text-2xl font-bold text-success">Ready</p>
              <p className="mt-1 text-xs text-muted-foreground">Demo data connected</p>
            </div>
          </div>
        </div>
        <div className="surface-panel p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <Users className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">Staff access</h2>
              <p className="text-xs text-muted-foreground">Demo role assignments</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {DEMO_STAFF_ACCOUNTS.map((account) => (
              <div key={account.role} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{account.displayName}</span>
                  <Badge variant="secondary" className="capitalize">
                    {account.role}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{account.email}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (role === "encoder") {
    return (
      <section className="mt-8 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
        <div className="surface-panel flex min-w-0 flex-col justify-between gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="min-w-0">
            <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
              <ClipboardPlus className="size-5" />
            </span>
            <h2 className="mt-4 break-words text-xl font-semibold">{title}</h2>
            <p className="mt-2 max-w-xl break-words text-sm leading-6 text-muted-foreground">
              {text}
            </p>
          </div>
          <Button onClick={onAdd} className="w-full shrink-0 sm:w-auto">
            <Plus /> Add violation
          </Button>
        </div>
        <div className="surface-panel min-w-0 p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <FileSearch className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold">Encoder checklist</h2>
              <p className="text-xs text-muted-foreground">Before publishing a citation</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-5 text-muted-foreground">
            <li className="flex min-w-0 items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              <span className="break-words">Confirm ticket and plate details.</span>
            </li>
            <li className="flex min-w-0 items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              <span className="break-words">Select the correct ordinance code.</span>
            </li>
            <li className="flex min-w-0 items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              <span className="break-words">Keep the fine and location accurate.</span>
            </li>
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
      <div className="surface-panel p-6">
        <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
          <FileSearch className="size-5" />
        </span>
        <h2 className="mt-4 text-xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{text}</p>
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" />
          Editing and staff controls are hidden for viewer accounts.
        </div>
      </div>
      <div className="surface-panel p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
            <WalletCards className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">Review focus</h2>
            <p className="text-xs text-muted-foreground">What you can do here</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <p className="rounded-lg bg-secondary/60 p-3 text-sm">Search all violation records.</p>
          <p className="rounded-lg bg-secondary/60 p-3 text-sm">Filter by payment status.</p>
          <p className="rounded-lg bg-secondary/60 p-3 text-sm">Review collection history.</p>
        </div>
      </div>
    </section>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "success" | "accent";
}) {
  return (
    <article className="surface-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex size-9 items-center justify-center rounded-lg ${tone === "accent" ? "bg-accent/20 text-accent-foreground" : tone === "success" ? "bg-success/15 text-success" : "bg-secondary text-primary"}`}
        >
          <Icon className="size-4" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="mt-4 truncate font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
    </article>
  );
}

function ViolationRow({
  violation,
  canManage,
  canDelete,
  onEdit,
  onDelete,
}: {
  violation: Violation;
  canManage: boolean;
  canDelete: boolean;
  onEdit: (violation: Violation) => void;
  onDelete: (violation: Violation) => void;
}) {
  const statusVariant =
    violation.status === "paid"
      ? "default"
      : violation.status === "unpaid"
        ? "secondary"
        : "outline";
  return (
    <tr className="hover:bg-secondary/20">
      <td className="px-5 py-4 font-mono text-xs font-semibold text-primary">
        {violation.ticket_number}
      </td>
      <td className="px-5 py-4">
        <div className="font-medium">{violation.violator_name}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {violation.vehicle_plate ?? "No plate"}
        </div>
      </td>
      <td className="px-5 py-4">
        <div>{violation.violation_type}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {violation.location ?? "Location not recorded"}
        </div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
        {formatDate(violation.issued_at)}
      </td>
      <td className="px-5 py-4 whitespace-nowrap font-medium">
        {formatCurrency(Number(violation.fine_amount))}
      </td>
      <td className="px-5 py-4">
        <Badge variant={statusVariant} className="capitalize">
          {violation.status}
        </Badge>
      </td>
      <td className="px-5 py-4 text-right">
        {canManage ? (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Edit ${violation.ticket_number}`}
              onClick={() => onEdit(violation)}
            >
              <Pencil />
            </Button>
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                aria-label={`Delete ${violation.ticket_number}`}
                onClick={() => onDelete(violation)}
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">View only</span>
        )}
      </td>
    </tr>
  );
}

function QuickGuide({ onAdd, canManage }: { onAdd: () => void; canManage: boolean }) {
  return (
    <aside className="surface-panel h-fit p-6">
      <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
        <FileSearch className="size-5" />
      </span>
      <h2 className="mt-4 text-xl font-semibold">Keep cases organized</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Use the search and status filters to find a case quickly, or add a new violation as soon as
        it is issued.
      </p>
      <div className="mt-6 space-y-4 border-t border-border pt-5">
        <GuideStep
          icon={Users}
          title="Record the violator"
          text="Keep the ticket number and contact details accurate."
        />
        <GuideStep
          icon={WalletCards}
          title="Track collection"
          text="Paid tickets update your collection totals automatically."
        />
        <GuideStep
          icon={ShieldCheck}
          title="Protect access"
          text="Only authorized staff can manage LGU records."
        />
      </div>
      <Button variant="outline" className="mt-6 w-full" onClick={onAdd} disabled={!canManage}>
        <ClipboardPlus /> Add a violation
      </Button>
      {!canManage ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Viewer access is read-only.
        </p>
      ) : null}
    </aside>
  );
}

function GuideStep({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function AddViolationForm({
  id,
  form,
  onSubmit,
  onClose,
  busy,
  editing,
}: {
  id: string;
  form: typeof emptyForm;
  onSubmit: (draft: typeof emptyForm) => void;
  onClose: () => void;
  busy: boolean;
  editing: boolean;
}) {
  return (
    <aside id={id} className="surface-panel h-fit scroll-mt-6 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ClipboardPlus className="size-5" />
          </span>
          <h2 className="mt-4 text-xl font-semibold">
            {editing ? "Edit violator" : "Add violator"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {editing
              ? "Update the ticket record and its status."
              : "Create a new ticket record for the LGU."}
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close add form" onClick={onClose}>
          ×
        </Button>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(readViolationDraft(event.currentTarget));
        }}
        className="mt-6 space-y-3"
      >
        <Field
          id="new-ticket"
          name="ticketNumber"
          label="Ticket number"
          value={form.ticketNumber}
          placeholder="OVS-2026-000109"
          required
        />
        <Field
          id="new-name"
          name="violatorName"
          label="Violator name"
          value={form.violatorName}
          placeholder="Full name"
          required
        />
        <Field
          id="new-violation"
          name="violationType"
          label="Violation type"
          value={form.violationType}
          placeholder="e.g. Illegal parking"
          required
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            id="new-ordinance"
            name="ordinanceCode"
            label="Ordinance"
            value={form.ordinanceCode}
            placeholder="Ord. 0000"
          />
          <Field
            id="new-fine"
            name="fineAmount"
            label="Fine (PHP)"
            type="number"
            min="0"
            step="0.01"
            value={form.fineAmount}
            placeholder="500"
            required
          />
        </div>
        <Field
          id="new-location"
          name="location"
          label="Location"
          value={form.location}
          placeholder="Where it was issued"
        />
        <div className="space-y-1.5">
          <Label htmlFor="new-status" className="text-xs">
            Status
          </Label>
          <select
            id="new-status"
            name="status"
            defaultValue={form.status}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="contested">Contested</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            id="new-plate"
            name="vehiclePlate"
            label="Vehicle plate"
            value={form.vehiclePlate}
            placeholder="ABC 1234"
          />
          <Field
            id="new-officer"
            name="officer"
            label="Officer"
            value={form.officer}
            placeholder="Officer name"
          />
        </div>
        <Button type="submit" className="mt-2 w-full" disabled={busy}>
          {busy ? "Saving…" : editing ? "Update violation" : "Save violation"} <ArrowRight />
        </Button>
      </form>
    </aside>
  );
}

function PaymentHistory({
  payments,
  violations,
}: {
  payments: Payment[];
  violations: Violation[];
}) {
  const ticketById = new Map(
    violations.map((violation) => [violation.id, violation.ticket_number]),
  );

  return (
    <section className="surface-panel mt-6 overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Payment transaction history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every completed gateway settlement with its reference and channel.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent-text">
          <CircleDollarSign className="size-4" /> {payments.length} records
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-secondary/25 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Reference</th>
              <th className="px-5 py-3 font-semibold">Ticket</th>
              <th className="px-5 py-3 font-semibold">Channel</th>
              <th className="px-5 py-3 font-semibold">Payer</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Paid at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  No payment transactions have been recorded yet.
                </td>
              </tr>
            ) : (
              payments.slice(0, 8).map((payment) => (
                <tr key={payment.id} className="hover:bg-secondary/20">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-primary">
                    {payment.reference}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">
                    {ticketById.get(payment.violation_id) ?? "Unknown ticket"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2">
                      <WalletCards className="size-4 text-primary" /> {payment.channel}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{payment.payer_email ?? "—"}</td>
                  <td className="px-5 py-4 whitespace-nowrap font-medium">
                    {formatCurrency(Number(payment.amount))}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                    {formatDate(payment.paid_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {payments.length > 8 ? (
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Showing the 8 most recent transactions.
        </p>
      ) : null}
    </section>
  );
}

function Field({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  min,
  step,
}: {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        min={min}
        step={step}
        defaultValue={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
