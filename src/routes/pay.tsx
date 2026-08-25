import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  Mail,
  Search,
  ShieldCheck,
  Ticket,
  WalletCards,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHANNEL_GROUPS } from "@/routes/channels";
import { DEMO_MODE, DEMO_TICKETS } from "@/lib/demo-data";
import { lookupTicket, settleTicket, type PublicTicket } from "@/lib/ovs.functions";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/pay")({
  head: () => ({
    meta: [
      { title: "Pay a Ticket | OVS" },
      {
        name: "description",
        content:
          "Look up an ordinance violation ticket and settle it securely online through Surepay.",
      },
    ],
  }),
  component: Pay,
});

const paymentChannels = CHANNEL_GROUPS.flatMap((group) => group.items);

type PaymentResult = {
  reference: string;
  amount: number;
  channel: string;
  ticketNumber: string;
  paidAt: string;
};

function Pay() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("GCash");
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setTicketNumber("");
    setTicket(null);
    setPayment(null);
    setReviewing(false);
    setError("");
    setEmail("");
  };

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setReviewing(false);
    setBusy(true);

    try {
      if (DEMO_MODE) {
        const demoTicket = DEMO_TICKETS.find(
          (item) => item.ticket_number === ticketNumber.trim().toUpperCase(),
        );
        setTicket(demoTicket ?? null);
        if (!demoTicket) {
          setError("We couldn't find that demo ticket. Try one of the sample numbers below.");
        }
        return;
      }
      const result = await lookupTicket({ data: { ticketNumber } });
      if (!result.ticket) {
        setTicket(null);
        setError("We couldn't find that ticket. Check the number and try again.");
      } else {
        setTicket(result.ticket);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to look up that ticket right now.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePayment() {
    if (!ticket) return;

    setError("");
    setBusy(true);

    try {
      if (DEMO_MODE) {
        setPayment({
          reference: `DEMO-${ticket.ticket_number.slice(-6)}-${Date.now().toString(36).toUpperCase()}`,
          amount: ticket.fine_amount,
          channel: selectedChannel,
          ticketNumber: ticket.ticket_number,
          paidAt: new Date().toISOString(),
        });
        setTicket({ ...ticket, status: "paid" });
        return;
      }
      const result = await settleTicket({
        data: {
          ticketNumber: ticket.ticket_number,
          channel: selectedChannel,
          email,
        },
      });
      setPayment(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment could not be processed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to OVS
        </Link>

        <div className="mt-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            <ShieldCheck className="size-3.5" /> Secure online settlement
          </span>
          <h1 className="text-display mt-5 text-4xl font-bold sm:text-5xl">
            Pay a violation ticket
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Enter the ticket number from your citation to review the details, choose a payment
            channel, and get your electronic receipt.
          </p>
        </div>

        {payment ? (
          <SuccessCard payment={payment} onPayAnother={reset} />
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="surface-panel p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Search className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    Step 01
                  </p>
                  <h2 className="text-xl font-semibold">Find your ticket</h2>
                </div>
              </div>
              <form onSubmit={handleLookup} className="mt-7 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket-number">Ticket number</Label>
                  <Input
                    id="ticket-number"
                    value={ticketNumber}
                    onChange={(event) => setTicketNumber(event.target.value.toUpperCase())}
                    placeholder="OVS-2026-000101"
                    autoComplete="off"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Example: OVS-2026-000101</p>
                  {DEMO_MODE ? (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="text-muted-foreground">Try demo ticket:</span>
                      {DEMO_TICKETS.slice(0, 3).map((demoTicket) => (
                        <button
                          key={demoTicket.ticket_number}
                          type="button"
                          onClick={() => setTicketNumber(demoTicket.ticket_number)}
                          className="font-mono font-semibold text-primary underline-offset-2 hover:underline"
                        >
                          {demoTicket.ticket_number.slice(-6)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Checking ticket…" : "View ticket details"} <ArrowRight />
                </Button>
              </form>
              <div className="mt-7 flex gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>Your ticket number is used only to retrieve the matching violation record.</p>
              </div>
            </section>

            <section className="surface-panel p-6 sm:p-8">
              {!ticket ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
                    <Ticket className="size-7" />
                  </span>
                  <h2 className="mt-5 text-xl font-semibold">Your ticket appears here</h2>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Review the violation details before you continue to payment.
                  </p>
                </div>
              ) : reviewing ? (
                <PaymentReview
                  ticket={ticket}
                  email={email}
                  selectedChannel={selectedChannel}
                  onBack={() => {
                    setReviewing(false);
                    setError("");
                  }}
                  onConfirm={() => void handlePayment()}
                  busy={busy}
                />
              ) : (
                <TicketDetails
                  ticket={ticket}
                  email={email}
                  selectedChannel={selectedChannel}
                  onEmailChange={setEmail}
                  onChannelChange={setSelectedChannel}
                  onReview={() => {
                    setError("");
                    setReviewing(true);
                  }}
                  onReset={reset}
                  busy={busy}
                />
              )}
            </section>
          </div>
        )}

        {error ? (
          <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Payments are processed through Surepay Technologies Inc. For help, contact
          admin@surepayinc.com.ph.
        </p>
      </div>
    </div>
  );
}

function TicketDetails({
  ticket,
  email,
  selectedChannel,
  onEmailChange,
  onChannelChange,
  onReview,
  onReset,
  busy,
}: {
  ticket: PublicTicket;
  email: string;
  selectedChannel: string;
  onEmailChange: (value: string) => void;
  onChannelChange: (value: string) => void;
  onReview: () => void;
  onReset: () => void;
  busy: boolean;
}) {
  const canPay = ticket.status === "unpaid";

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Ticket found
          </p>
          <h2 className="mt-1 font-mono text-lg font-semibold">{ticket.ticket_number}</h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
            canPay
              ? "bg-warning/20 text-warning-foreground"
              : "bg-success/15 text-success-foreground"
          }`}
        >
          {ticket.status}
        </span>
      </div>

      <div className="mt-6 rounded-xl bg-secondary/70 p-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">Amount due</span>
          <span className="font-display text-2xl font-bold text-primary">
            {formatCurrency(ticket.fine_amount)}
          </span>
        </div>
        <div className="mt-4 grid gap-3 border-t border-border/70 pt-4 text-sm sm:grid-cols-2">
          <Detail label="Violator" value={ticket.violator_name} />
          <Detail label="Violation" value={ticket.violation_type} />
          <Detail label="Ordinance" value={ticket.ordinance_code ?? "—"} />
          <Detail label="Issued" value={formatDate(ticket.issued_at)} />
          <Detail label="Location" value={ticket.location ?? "—"} />
          <Detail label="Vehicle plate" value={ticket.vehicle_plate ?? "—"} />
        </div>
      </div>

      {canPay ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onReview();
          }}
          className="mt-6 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="payer-email">Receipt email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="payer-email"
                type="email"
                className="pl-9"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-channel">Payment channel</Label>
            <select
              id="payment-channel"
              value={selectedChannel}
              onChange={(event) => onChannelChange(event.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {paymentChannels.map((channel) => (
                <option key={channel}>{channel}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Review payment details <ArrowRight />
          </Button>
          <Button type="submit" className="hidden" disabled={busy}>
            {busy ? "Processing payment…" : `Pay ${formatCurrency(ticket.fine_amount)}`}{" "}
            <ArrowRight />
          </Button>
        </form>
      ) : (
        <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success-foreground">
          This ticket is already marked as {ticket.status}. No further payment is required.
        </div>
      )}

      <Button type="button" variant="ghost" size="sm" className="mt-3 w-full" onClick={onReset}>
        Look up a different ticket
      </Button>
    </div>
  );
}

function PaymentReview({
  ticket,
  email,
  selectedChannel,
  onBack,
  onConfirm,
  busy,
}: {
  ticket: PublicTicket;
  email: string;
  selectedChannel: string;
  onBack: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ClipboardCheck className="size-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Step 03</p>
          <h2 className="text-xl font-semibold">Review payment details</h2>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Check the details below before you confirm. Your payment request will be sent through the
        selected channel after you continue.
      </p>

      <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-secondary/40">
        <div className="flex items-center justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">Ticket number</span>
          <span className="font-mono text-sm font-semibold">{ticket.ticket_number}</span>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">Violation</span>
          <span className="text-right text-sm font-medium">{ticket.violation_type}</span>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">Receipt email</span>
          <span className="text-right text-sm font-medium">{email}</span>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <span className="text-sm text-muted-foreground">Payment channel</span>
          <span className="inline-flex items-center gap-2 text-right text-sm font-medium">
            <WalletCards className="size-4 text-primary" /> {selectedChannel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <span className="text-sm font-semibold">Total to pay</span>
          <span className="font-display text-2xl font-bold text-primary">
            {formatCurrency(ticket.fine_amount)}
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-accent-foreground">
        By confirming, you authorize this demo gateway to record the amount above as a completed
        settlement.
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={busy}>
          <ArrowLeft /> Back to edit
        </Button>
        <Button type="button" onClick={onConfirm} disabled={busy}>
          {busy ? "Processing payment…" : "Confirm & pay"} <CheckCircle2 />
        </Button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function SuccessCard({
  payment,
  onPayAnother,
}: {
  payment: PaymentResult;
  onPayAnother: () => void;
}) {
  return (
    <section className="surface-panel mx-auto mt-10 max-w-2xl overflow-hidden">
      <div className="hero-gradient px-6 py-10 text-center text-primary-foreground sm:px-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success text-success-foreground">
          <CheckCircle2 className="size-8" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Transaction complete
        </p>
        <h2 className="text-display mt-2 text-3xl font-bold">Payment received</h2>
        <p className="mt-3 text-sm text-primary-foreground/75">
          Your electronic receipt reference is{" "}
          <span className="font-mono text-accent">{payment.reference}</span>.
        </p>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
        <Detail label="Ticket number" value={payment.ticketNumber} />
        <Detail label="Amount paid" value={formatCurrency(payment.amount)} />
        <Detail label="Payment channel" value={payment.channel} />
        <Detail label="Paid at" value={formatDate(payment.paidAt)} />
        <div className="sm:col-span-2 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <Clock3 className="size-4" /> Keep your reference number for future inquiries.
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-3">
          <Button type="button" onClick={() => window.print()}>
            <FileText /> Print receipt
          </Button>
          <Button type="button" variant="outline" onClick={onPayAnother}>
            Pay another ticket
          </Button>
        </div>
      </div>
    </section>
  );
}
