import { type FormEvent, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, CheckCircle2, Megaphone, ShieldCheck } from "lucide-react";

import trafficImage from "@/assets/edsa-traffic-xl-f14437c9.png";
import tagumCityLogo from "@/assets/tagum-city-seal.png";
import { DEMO_MODE, DEMO_VIOLATIONS, DEMO_VIOLATIONS_STORAGE_KEY } from "@/lib/demo-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { lookupViolationsByPlate, type PublicTicket } from "@/lib/ovs.functions";

function readDemoPlateTickets(vehiclePlate: string): PublicTicket[] {
  const normalizedPlate = vehiclePlate.toUpperCase().replace(/\s+/g, " ").trim();
  let records = DEMO_VIOLATIONS;

  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(DEMO_VIOLATIONS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) records = parsed as typeof DEMO_VIOLATIONS;
      } catch {
        records = DEMO_VIOLATIONS;
      }
    }
  }

  return records
    .filter(
      (record) =>
        record.vehicle_plate?.toUpperCase().replace(/\s+/g, " ").trim() === normalizedPlate,
    )
    .map((record) => ({
      ticket_number: record.ticket_number,
      violator_name: record.violator_name,
      violation_type: record.violation_type,
      ordinance_code: record.ordinance_code,
      fine_amount: Number(record.fine_amount),
      location: record.location,
      issued_at: record.issued_at,
      status: record.status,
      vehicle_plate: record.vehicle_plate,
    }));
}

export const Route = createFileRoute("/pay")({
  head: () => ({
    meta: [
      { title: "Pay a Violation Ticket | Tagum City Traffic Management Office" },
      {
        name: "description",
        content:
          "Check a vehicle plate for violations through the Tagum City Traffic Management Office demo.",
      },
    ],
  }),
  component: Pay,
});

function Pay() {
  const [plateNumber, setPlateNumber] = useState("");
  const [mvFileNumber, setMvFileNumber] = useState("");
  const [lookupMessage, setLookupMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [matches, setMatches] = useState<PublicTicket[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!plateNumber.trim() || !mvFileNumber.trim()) {
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

    try {
      const normalizedPlate = plateNumber.toUpperCase().replace(/\s+/g, " ").trim();
      const tickets = DEMO_MODE
        ? readDemoPlateTickets(normalizedPlate)
        : (await lookupViolationsByPlate({ data: { vehiclePlate: normalizedPlate } })).tickets;

      setMatches(tickets);
      setLookupMessage(
        tickets.length
          ? {
              tone: "success",
              text: `${tickets.length} violation record${tickets.length === 1 ? "" : "s"} found for ${normalizedPlate}.`,
            }
          : {
              tone: "error",
              text: `No violation records found for ${normalizedPlate}. Check the plate number and try again.`,
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
                  }}
                  placeholder="MV FILE NO."
                  autoComplete="off"
                  className="w-full bg-transparent text-center font-display text-base font-semibold tracking-[0.12em] text-foreground outline-none placeholder:text-muted-foreground sm:text-lg"
                />
              </label>
              <p className="mt-2 text-center text-xs text-muted-foreground sm:text-sm">
                As printed on your LTO Certificate of Registration (CR)
              </p>
            </form>

            <div className="relative z-10 mt-4 flex w-full max-w-[300px] items-center gap-3 rounded-sm border border-border bg-card px-3 py-2 shadow sm:mt-5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
                <Check className="size-4" strokeWidth={3} />
              </span>
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground">Verification ready</p>
                <p className="text-[10px] text-muted-foreground">Demo protection check</p>
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
          This native NCAS demo reproduces the Tagum City Traffic Management Office lookup
          experience. All interactions on this page stay within the NCAS demo workspace.
        </p>
      </section>
    </div>
  );
}
