import { type FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, CheckCircle2, Megaphone, ShieldCheck } from "lucide-react";

import trafficImage from "@/assets/edsa-traffic-xl-f14437c9.png";
import tagumCityLogo from "@/assets/tagum-city-seal.png";
import { CHANNEL_GROUPS } from "@/routes/channels";
import { lookupByPlate, settleTicket, type PublicTicket, type SettlementReceipt } from "@/lib/api";
import { DEMO_MODE } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { normalizeVehiclePlate } from "@/lib/plate";

type PaySearch = {
  plate?: string;
  mv?: string;
};

export const Route = createFileRoute("/pay")({
  validateSearch: (search: Record<string, unknown>): PaySearch => {
    const plate = search["plate"];
    const mv = search["mv"];
    return {
      ...(typeof plate === "string" ? { plate } : {}),
      ...(typeof mv === "string" ? { mv } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Pay a Violation Ticket | Tagum City Traffic Management Office" },
      {
        name: "description",
        content:
          "Check a vehicle plate for violations and settle an open ticket through the Tagum City Traffic Management Office portal.",
      },
    ],
  }),
  component: Pay,
});

function Pay() {
  const search = Route.useSearch();
  const [plateNumber, setPlateNumber] = useState(search.plate ?? "");
  const [mvFileNumber, setMvFileNumber] = useState(search.mv ?? "");
  const [lookupMessage, setLookupMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [matches, setMatches] = useState<PublicTicket[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [receipt, setReceipt] = useState<SettlementReceipt | null>(null);

  async function runLookup(plate: string, mvFile: string) {
    if (!plate.trim() || !mvFile.trim()) {
      setMatches([]);
      setLookupMessage({
        tone: "error",
        text: "Enter both your plate number and MV file number to continue.",
      });
      return;
    }

    setIsChecking(true);
    setLookupMessage(null);
    setMatches([]);
    setReceipt(null);

    try {
      const normalizedPlate = normalizeVehiclePlate(plate);
      const tickets = (await lookupByPlate(normalizedPlate, mvFile.trim())).tickets;

      setMatches(tickets);
      setLookupMessage(
        tickets.length
          ? {
              tone: "success",
              text: `${tickets.length} violation record${tickets.length === 1 ? "" : "s"} found for ${normalizedPlate}.`,
            }
          : {
              tone: "error",
              text: `No violation records found for ${normalizedPlate}. Check the plate number and MV file number, then try again.`,
            },
      );
    } catch (cause) {
      setLookupMessage({
        tone: "error",
        text: cause instanceof Error ? cause.message : "Unable to complete the plate lookup.",
      });
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    if (search.plate && search.mv) {
      void runLookup(search.plate, search.mv);
    }
    // Prefill from the portal only when those search values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.plate, search.mv]);

  function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runLookup(plateNumber, mvFileNumber);
  }

  function markPaid(ticketNumber: string, nextReceipt: SettlementReceipt) {
    setReceipt(nextReceipt);
    setMatches((current) =>
      current.map((ticket) =>
        ticket.ticket_number === ticketNumber ? { ...ticket, status: "paid" } : ticket,
      ),
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10 lg:py-14">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to NCAS
      </Link>

      <section className="tagum-theme surface-panel mx-auto mt-6 max-w-6xl overflow-hidden bg-card sm:mt-8">
        <div className="relative overflow-hidden">
          <div
            className="relative flex min-h-[700px] flex-col items-center overflow-hidden px-4 pb-12 pt-8 sm:min-h-[760px] sm:pt-10"
            style={{
              backgroundImage: `linear-gradient(to bottom, oklch(1 0 0 / 0.82), oklch(1 0 0 / 0.72)), url(${trafficImage})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          >
            <div className="absolute inset-0 bg-card/10" aria-hidden="true" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <img
                src={tagumCityLogo}
                alt="Tagum City Traffic Management Office"
                className="size-20 rounded-full object-contain sm:size-24"
              />
              <span className="mt-3 bg-destructive px-5 py-2 text-xs font-bold uppercase tracking-wide text-destructive-foreground sm:text-sm">
                No Contact Apprehension Policy
              </span>
              <h1 className="mt-4 max-w-xl font-display text-3xl font-bold uppercase leading-tight tracking-tight text-foreground sm:text-4xl">
                Tagum City Traffic Management Office
              </h1>
            </div>

            <form
              id="tctmo-lookup-form"
              onSubmit={handleLookup}
              className="relative z-10 mt-6 w-full max-w-[540px] rounded-2xl border border-border bg-card p-5 shadow-lift sm:mt-5 sm:p-6"
            >
              <label
                htmlFor="plate-number"
                className="flex h-14 items-center rounded-xl border border-primary/30 bg-muted px-4 focus-within:ring-2 focus-within:ring-ring sm:h-16"
              >
                <span className="sr-only">Plate number</span>
                <input
                  id="plate-number"
                  value={plateNumber}
                  onChange={(event) => {
                    setPlateNumber(event.target.value.toUpperCase());
                    setLookupMessage(null);
                    setMatches([]);
                    setReceipt(null);
                  }}
                  placeholder="PLATE NUMBER"
                  autoComplete="off"
                  className="w-full bg-transparent text-center font-display text-base font-semibold tracking-[0.12em] text-foreground outline-none placeholder:text-muted-foreground sm:text-lg"
                />
              </label>

              <div className="my-4 flex items-center gap-4 text-sm font-bold text-foreground sm:my-5">
                <span className="h-0.5 flex-1 bg-foreground" />
                <span>AND</span>
                <span className="h-0.5 flex-1 bg-foreground" />
              </div>

              <label
                htmlFor="mv-file-number"
                className="flex h-14 items-center rounded-xl border border-primary/30 bg-muted px-4 focus-within:ring-2 focus-within:ring-ring sm:h-16"
              >
                <span className="sr-only">MV file number</span>
                <input
                  id="mv-file-number"
                  value={mvFileNumber}
                  onChange={(event) => {
                    setMvFileNumber(event.target.value.toUpperCase());
                    setLookupMessage(null);
                    setMatches([]);
                    setReceipt(null);
                  }}
                  placeholder="MV FILE NO."
                  autoComplete="off"
                  className="w-full bg-transparent text-center font-display text-base font-semibold tracking-[0.12em] text-foreground outline-none placeholder:text-muted-foreground sm:text-lg"
                />
              </label>
              <p className="mt-2 text-center text-xs text-muted-foreground sm:text-sm">
                As printed on your LTO Certificate of Registration (CR)
              </p>
              {DEMO_MODE ? (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Demo lookup: plate ABC 1122 and MV file MV-1122.
                </p>
              ) : null}
            </form>

            <div className="relative z-10 mt-4 flex w-full max-w-[300px] items-center gap-3 rounded-sm border border-border bg-card px-3 py-2 shadow sm:mt-5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
                <Check className="size-4" strokeWidth={3} />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground">Verification ready</p>
                <p className="text-[10px] text-muted-foreground">Plate and MV file must match</p>
              </div>
              <ShieldCheck className="ml-auto size-5 text-primary" />
            </div>

            <button
              type="submit"
              form="tctmo-lookup-form"
              disabled={isChecking}
              className="relative z-10 mt-5 flex min-h-14 w-full max-w-[540px] items-center justify-center rounded-xl bg-primary/75 px-6 text-base font-semibold text-primary-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-primary disabled:cursor-wait disabled:opacity-70 sm:min-h-16 sm:text-lg"
            >
              {isChecking ? "CHECKING RECORDS..." : "CHECK / PAY MY FINE"}
            </button>

            <div
              className="relative z-10 mt-4 min-h-6 w-full max-w-[540px] text-center"
              aria-live="polite"
            >
              {lookupMessage && (
                <div
                  className={`rounded-lg border px-4 py-2 text-xs font-medium sm:text-sm ${lookupMessage.tone === "success" ? "border-success/30 bg-success/15 text-foreground" : "border-destructive/30 bg-destructive/10 text-foreground"}`}
                >
                  {lookupMessage.tone === "success" && (
                    <CheckCircle2 className="mr-1 inline size-4" />
                  )}
                  {lookupMessage.text}
                </div>
              )}
            </div>

            {receipt ? (
              <div className="relative z-10 mt-4 w-full max-w-[540px] rounded-xl border border-success/30 bg-card p-4 text-left shadow-panel sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-success">
                  Payment recorded
                </p>
                <h2 className="mt-1 text-lg font-semibold">{receipt.ticketNumber}</h2>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Reference</dt>
                    <dd className="font-mono font-semibold">{receipt.reference}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Amount</dt>
                    <dd className="font-semibold">{formatCurrency(receipt.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Channel</dt>
                    <dd>{receipt.channel}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Paid</dt>
                    <dd>{formatDate(receipt.paidAt)}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {matches.length > 0 && (
              <div className="relative z-10 mt-4 w-full max-w-[540px] space-y-3 text-left">
                {matches.map((ticket) => (
                  <article
                    key={ticket.ticket_number}
                    className="rounded-xl border border-border bg-card p-4 shadow-panel sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs font-semibold text-primary">
                          {ticket.ticket_number}
                        </p>
                        <h2 className="mt-1 text-base font-semibold">{ticket.violation_type}</h2>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${ticket.status === "paid" ? "bg-success/15 text-success" : "bg-accent/25 text-accent-foreground"}`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 border-t border-border pt-3 text-xs sm:grid-cols-3">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatCurrency(ticket.fine_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issued</p>
                        <p className="mt-1 text-sm font-medium">{formatDate(ticket.issued_at)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="mt-1 text-sm font-medium">
                          {ticket.location ?? "Not recorded"}
                        </p>
                      </div>
                    </div>
                    {ticket.status === "unpaid" ? (
                      <SettleForm ticket={ticket} onPaid={markPaid} />
                    ) : null}
                  </article>
                ))}
              </div>
            )}

            <span
              role="img"
              aria-label="Traffic management announcements"
              className="absolute bottom-5 right-5 z-10 flex size-12 items-center justify-center rounded-full border-4 border-card bg-card text-primary shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:right-7"
            >
              <Megaphone className="size-5" />
            </span>
          </div>
        </div>

        <p className="border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-6">
          Plate lookup matches the MV file number on the certificate of registration. An unpaid
          ticket can be settled here, and the receipt is stored with the Laravel record.
        </p>
      </section>
    </div>
  );
}

function SettleForm({
  ticket,
  onPaid,
}: {
  ticket: PublicTicket;
  onPaid: (ticketNumber: string, receipt: SettlementReceipt) => void;
}) {
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState("GCash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const receipt = await settleTicket({
        ticketNumber: ticket.ticket_number,
        channel,
        email,
      });
      onPaid(ticket.ticket_number, receipt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="mt-4 space-y-3 border-t border-border pt-4">
      <label className="block text-xs font-medium text-muted-foreground" htmlFor={`email-${ticket.ticket_number}`}>
        Receipt email
        <input
          id={`email-${ticket.ticket_number}`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@email.com"
          className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <label className="block text-xs font-medium text-muted-foreground" htmlFor={`channel-${ticket.ticket_number}`}>
        Payment channel
        <select
          id={`channel-${ticket.ticket_number}`}
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          {CHANNEL_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.items.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
      >
        {busy ? "Recording payment..." : `Pay ${formatCurrency(ticket.fine_amount)}`}
      </button>
    </form>
  );
}
