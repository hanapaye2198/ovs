import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  LogOut,
  Receipt,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  DEMO_CITIZEN,
  DEMO_CITIZEN_PAYMENTS,
  DEMO_CITIZEN_SESSION_KEY,
  DEMO_CITIZEN_TICKETS,
  DEMO_TICKETS,
  DEMO_MODE,
} from "@/lib/demo-data";
import {
  getCitizenPayments,
  lookupTicket,
  type CitizenPayment,
  type PublicTicket,
} from "@/lib/ovs.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Citizen Portal | NCAS" },
      {
        name: "description",
        content:
          "Create a citizen portal account, manage your NCAS profile, and settle ordinance violation tickets online.",
      },
    ],
  }),
  component: Portal,
});

type PortalUser = {
  email: string;
  fullName: string;
  createdAt: string;
};

function Portal() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<PortalUser | null>(null);
  const [payments, setPayments] = useState<CitizenPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadPaymentHistory = useCallback(async () => {
    setPaymentsLoading(true);
    setPaymentsError("");
    if (DEMO_MODE) {
      setPayments([...DEMO_CITIZEN_PAYMENTS]);
      setPaymentsLoading(false);
      return;
    }
    try {
      const result = await getCitizenPayments();
      setPayments(result.payments);
    } catch (cause) {
      setPaymentsError(
        cause instanceof Error ? cause.message : "Unable to load your payment history.",
      );
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  const hydrateUser = useCallback(
    async (authUser: {
      id: string;
      email?: string;
      created_at: string;
      user_metadata: Record<string, unknown>;
    }) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authUser.id)
        .maybeSingle();
      const metadataName = authUser.user_metadata["full_name"];
      const profileName =
        profile?.full_name ?? (typeof metadataName === "string" ? metadataName : "");

      setUser({
        email: authUser.email ?? "",
        fullName: profileName || "NCAS citizen",
        createdAt: authUser.created_at,
      });
    },
    [],
  );

  useEffect(() => {
    if (DEMO_MODE) {
      const stored = window.localStorage.getItem(DEMO_CITIZEN_SESSION_KEY);
      if (stored === "active") {
        setUser({
          email: DEMO_CITIZEN.email,
          fullName: DEMO_CITIZEN.fullName,
          createdAt: "2026-08-01T08:00:00.000Z",
        });
        setPayments([...DEMO_CITIZEN_PAYMENTS]);
      }
      setChecking(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session?.user) {
        await hydrateUser(data.session.user);
        await loadPaymentHistory();
      }
      if (active) setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [hydrateUser, loadPaymentHistory]);

  function switchMode(nextMode: "sign-in" | "sign-up") {
    setMode(nextMode);
    setMessage("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      if (DEMO_MODE) {
        if (
          mode === "sign-in" &&
          (email.trim().toLowerCase() !== DEMO_CITIZEN.email || password !== DEMO_CITIZEN.password)
        ) {
          setError("Invalid citizen email or password.");
          return;
        }
        const demoUser = {
          email: mode === "sign-in" ? DEMO_CITIZEN.email : email.trim(),
          fullName: mode === "sign-in" ? DEMO_CITIZEN.fullName : fullName.trim(),
          createdAt: "2026-08-01T08:00:00.000Z",
        };
        setUser({
          ...demoUser,
        });
        setPayments([...DEMO_CITIZEN_PAYMENTS]);
        window.localStorage.setItem(DEMO_CITIZEN_SESSION_KEY, "active");
        setMessage("Demo citizen account loaded. Your sample receipt is ready below.");
        setBusy(false);
        return;
      }
      if (mode === "sign-in") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.user) {
          await hydrateUser(data.user);
          await loadPaymentHistory();
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;

        if (data.session?.user) {
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: data.session.user.id,
            full_name: fullName.trim(),
          });
          if (profileError) throw profileError;
          await hydrateUser(data.session.user);
          await loadPaymentHistory();
        } else {
          setMessage("Your account is ready. Check your email to confirm it, then sign in here.");
          setMode("sign-in");
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to complete that request.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (DEMO_MODE) {
      window.localStorage.removeItem(DEMO_CITIZEN_SESSION_KEY);
    } else {
      await supabase.auth.signOut();
    }
    setUser(null);
    setPayments([]);
    setPaymentsError("");
    setMode("sign-up");
    setMessage("");
    setError("");
  }

  if (checking) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center px-4 py-14">
        <p className="text-sm text-muted-foreground">Checking your portal session…</p>
      </div>
    );
  }

  if (user) {
    return (
      <CitizenDashboard
        user={user}
        payments={payments}
        paymentsLoading={paymentsLoading}
        paymentsError={paymentsError}
        onRefresh={() => void loadPaymentHistory()}
        onSignOut={() => void handleSignOut()}
      />
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_0.88fr] lg:items-center lg:py-20">
      <section>
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          <ShieldCheck className="size-3.5" /> Citizen&apos;s portal
        </span>
        <h1 className="text-display mt-5 max-w-xl text-4xl font-bold sm:text-5xl">
          Your tickets, easier to manage.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Create an NCAS account for a smoother citizen experience, then move from ticket lookup to
          secure online payment whenever it is convenient.
        </p>

        <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
          <PortalBenefit
            icon={Ticket}
            title="Find tickets"
            text="Start with the number on your citation."
          />
          <PortalBenefit
            icon={WalletCards}
            title="Pay online"
            text="Choose from familiar payment channels."
          />
          <PortalBenefit
            icon={LockKeyhole}
            title="Stay secure"
            text="Your account and profile stay protected."
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link
            to="/pay"
            className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
          >
            Pay without signing in <ArrowRight className="size-4" />
          </Link>
          <span className="text-muted-foreground">No account is required to settle a ticket.</span>
        </div>
      </section>

      <section className="surface-panel mx-auto w-full max-w-md p-6 sm:p-8">
        <>
          <div className="flex rounded-lg bg-secondary p-1">
            {(["sign-up", "sign-in"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => switchMode(item)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === item
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {item === "sign-up" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>
          {DEMO_MODE ? (
            <Button
              type="button"
              variant="outline"
              className="mt-5 w-full"
              onClick={() => {
                setMode("sign-in");
                setEmail(DEMO_CITIZEN.email);
                setPassword(DEMO_CITIZEN.password);
                setError("");
                setMessage("");
              }}
            >
              Try demo citizen account
            </Button>
          ) : null}
          <div className="mt-7">
            <h2 className="text-2xl font-semibold">
              {mode === "sign-up" ? "Set up your portal" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "sign-up"
                ? "Use a few details to get started."
                : "Sign in to continue to your citizen portal."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "sign-up" ? (
              <div className="space-y-2">
                <Label htmlFor="citizen-name">Full name</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="citizen-name"
                    className="pl-9"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Juan Dela Cruz"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="citizen-email">Email address</Label>
              <Input
                id="citizen-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="citizen-password">Password</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="citizen-password"
                  type="password"
                  className="pl-9"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  required
                />
              </div>
            </div>

            {message ? (
              <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{message}</p>
            ) : null}
            {error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "sign-up"
                  ? "Create citizen account"
                  : "Open my portal"}{" "}
              <ArrowRight />
            </Button>
          </form>
          <div className="mt-6 flex items-start gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Your account is separate from LGU staff access and cannot open the management
              dashboard.
            </p>
          </div>
        </>
      </section>
    </div>
  );
}

function PortalBenefit({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <article className="surface-panel p-4">
      <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="size-4" />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </article>
  );
}

function CitizenDashboard({
  user,
  payments,
  paymentsLoading,
  paymentsError,
  onRefresh,
  onSignOut,
}: {
  user: PortalUser;
  payments: CitizenPayment[];
  paymentsLoading: boolean;
  paymentsError: string;
  onRefresh: () => void;
  onSignOut: () => void;
}) {
  const completedPayments = payments.filter((payment) => payment.status === "completed");
  const totalPaid = completedPayments.reduce((total, payment) => total + payment.amount, 0);
  const firstName = user.fullName.split(" ")[0] || "Citizen";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:py-12">
      <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <ShieldCheck className="size-3.5" /> Citizen portal
          </span>
          <h1 className="text-display mt-4 text-4xl font-bold sm:text-5xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Manage your ordinance violation payments, review receipts, and look up another ticket
            from one secure account.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/pay">
              <Ticket /> Look up a ticket
            </Link>
          </Button>
          <Button type="button" variant="outline" onClick={onSignOut}>
            <LogOut /> Sign out
          </Button>
        </div>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <CitizenStat
          icon={Receipt}
          label="Completed payments"
          value={String(completedPayments.length)}
          hint="Receipts in your account"
        />
        <CitizenStat
          icon={WalletCards}
          label="Total paid"
          value={formatCurrency(totalPaid)}
          hint="Across completed settlements"
          tone="accent"
        />
        <CitizenStat
          icon={CheckCircle2}
          label="Account status"
          value="Active"
          hint="Ticket access is ready"
          tone="success"
        />
      </div>

      <CitizenTicketLookup />
      <CitizenViolationList tickets={DEMO_CITIZEN_TICKETS} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <section className="surface-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
            Quick actions
          </p>
          <h2 className="mt-2 text-2xl font-semibold">What do you need today?</h2>
          <div className="mt-6 grid gap-3">
            <Button asChild variant="outline" className="justify-between">
              <Link to="/support">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck /> Contact support
                </span>
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-lg bg-secondary/60 p-4 text-sm text-muted-foreground">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              You can pay a ticket without an account, but signing in keeps your receipts together.
            </p>
          </div>
        </section>

        <section className="surface-panel p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
                My profile
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Account details</h2>
            </div>
            <span className="flex size-11 items-center justify-center rounded-full bg-success/15 text-success">
              <UserRound className="size-5" />
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-secondary/60 p-4">
              <p className="text-xs text-muted-foreground">Full name</p>
              <p className="mt-1 font-medium">{user.fullName}</p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-4">
              <p className="text-xs text-muted-foreground">Email address</p>
              <p className="mt-1 break-all font-medium">{user.email}</p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-4">
              <p className="text-xs text-muted-foreground">Account created</p>
              <p className="mt-1 font-medium">{formatDate(user.createdAt)}</p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-4">
              <p className="text-xs text-muted-foreground">Access</p>
              <p className="mt-1 font-medium text-success">Citizen account active</p>
            </div>
          </div>
        </section>
      </div>

      <section className="surface-panel mt-6 p-6">
        <CitizenPaymentHistory
          payments={payments}
          loading={paymentsLoading}
          error={paymentsError}
          onRefresh={onRefresh}
        />
      </section>
    </div>
  );
}

function CitizenTicketLookup() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setTicket(null);
    setBusy(true);

    try {
      const normalizedNumber = ticketNumber.trim().toUpperCase();
      if (DEMO_MODE) {
        const demoTicket = DEMO_TICKETS.find((item) => item.ticket_number === normalizedNumber);
        if (!demoTicket) {
          throw new Error("We couldn't find that ticket. Check the number and try again.");
        }
        setTicket(demoTicket);
        return;
      }

      const result = await lookupTicket({ data: { ticketNumber: normalizedNumber } });
      if (!result.ticket) {
        throw new Error("We couldn't find that ticket. Check the number and try again.");
      }
      setTicket(result.ticket);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to look up that ticket right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface-panel mt-8 overflow-hidden">
      <div className="border-b border-border bg-secondary/35 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
              Ticket center
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Look up another ticket</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the ticket number exactly as it appears on your citation.
            </p>
          </div>
          <Search className="hidden size-8 text-primary/40 sm:block" />
        </div>
        <form onSubmit={handleLookup} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Input
            value={ticketNumber}
            onChange={(event) => setTicketNumber(event.target.value)}
            placeholder="OVS-2026-000101"
            className="bg-background font-mono"
            aria-label="Ticket number"
            required
          />
          <Button type="submit" disabled={busy} className="sm:min-w-32">
            <Search /> {busy ? "Searching…" : "Search"}
          </Button>
        </form>
        {DEMO_MODE ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Demo tickets: OVS-2026-000101, OVS-2026-000102, or OVS-2026-000103.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="m-6 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {ticket ? (
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-semibold text-primary">{ticket.ticket_number}</p>
              <Badge
                variant={ticket.status === "unpaid" ? "secondary" : "default"}
                className="capitalize"
              >
                {ticket.status}
              </Badge>
            </div>
            <h3 className="mt-2 text-lg font-semibold">{ticket.violation_type}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Issued {formatDate(ticket.issued_at)} · {ticket.location ?? "Location not recorded"}
            </p>
          </div>
          <div className="flex items-center gap-4 sm:text-right">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="mt-1 text-xl font-bold">{formatCurrency(ticket.fine_amount)}</p>
            </div>
            {ticket.status === "unpaid" ? (
              <Button asChild>
                <Link to="/pay">
                  Continue to payment <ArrowRight />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CitizenViolationList({ tickets }: { tickets: PublicTicket[] }) {
  return (
    <section className="surface-panel mt-6 overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
            My records
          </p>
          <h2 className="mt-2 text-2xl font-semibold">My violation list</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Review the tickets connected to your citizen account.
          </p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
        </span>
      </div>

      {tickets.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No violation records are connected to this account yet.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-secondary/25 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-semibold">Ticket</th>
                  <th className="px-6 py-3 font-semibold">Violation</th>
                  <th className="px-6 py-3 font-semibold">Issued</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((ticket) => (
                  <CitizenViolationRow key={ticket.ticket_number} ticket={ticket} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border md:hidden">
            {tickets.map((ticket) => (
              <article key={ticket.ticket_number} className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-primary">
                      {ticket.ticket_number}
                    </p>
                    <h3 className="mt-1 break-words font-semibold">{ticket.violation_type}</h3>
                  </div>
                  <CitizenTicketStatus status={ticket.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Issued</p>
                    <p className="mt-1 font-medium">{formatDate(ticket.issued_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="mt-1 font-medium">{formatCurrency(ticket.fine_amount)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ticket.location ?? "Location not recorded"}
                </p>
                {ticket.status === "unpaid" ? (
                  <Button asChild size="sm" className="w-full">
                    <Link to="/pay">
                      Pay this ticket <ArrowRight />
                    </Link>
                  </Button>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function CitizenViolationRow({ ticket }: { ticket: PublicTicket }) {
  return (
    <tr className="hover:bg-secondary/20">
      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
        {ticket.ticket_number}
      </td>
      <td className="px-6 py-4">
        <p className="font-medium">{ticket.violation_type}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {ticket.location ?? "Location not recorded"}
        </p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
        {formatDate(ticket.issued_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap font-medium">
        {formatCurrency(ticket.fine_amount)}
      </td>
      <td className="px-6 py-4">
        <CitizenTicketStatus status={ticket.status} />
      </td>
      <td className="px-6 py-4 text-right">
        {ticket.status === "unpaid" ? (
          <Button asChild size="sm" variant="outline">
            <Link to="/pay">
              Pay <ArrowRight />
            </Link>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Receipt available</span>
        )}
      </td>
    </tr>
  );
}

function CitizenTicketStatus({ status }: { status: string }) {
  return (
    <Badge variant={status === "unpaid" ? "secondary" : "default"} className="capitalize">
      {status}
    </Badge>
  );
}

function CitizenStat({
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
      <span
        className={`flex size-10 items-center justify-center rounded-lg ${tone === "accent" ? "bg-accent/20 text-accent-foreground" : tone === "success" ? "bg-success/15 text-success" : "bg-secondary text-primary"}`}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </article>
  );
}

function CitizenPaymentHistory({
  payments,
  loading,
  error,
  onRefresh,
}: {
  payments: CitizenPayment[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">My recent payments</h3>
          <p className="mt-1 text-xs text-muted-foreground">Receipts tied to this email address.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-muted-foreground">Loading your receipts…</p>
      ) : null}
      {error ? (
        <p className="mt-5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {!loading && !error && payments.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-border p-4 text-center">
          <Receipt className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No payments yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your completed settlements will appear here.
          </p>
        </div>
      ) : null}
      {!loading && !error && payments.length > 0 ? (
        <div className="mt-5 space-y-3">
          {payments.slice(0, 5).map((payment) => (
            <article
              key={payment.reference}
              className="rounded-lg border border-border bg-secondary/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-semibold text-primary">
                    {payment.reference}
                  </p>
                  <p className="mt-1 text-sm font-medium">{payment.ticketNumber}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{payment.violationType}</p>
                </div>
                <p className="font-semibold">{formatCurrency(payment.amount)}</p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                <span>{payment.channel}</span>
                <span>{formatDate(payment.paidAt)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
