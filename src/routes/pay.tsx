import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Globe2, ShieldCheck } from "lucide-react";

const MMDA_PLATE_CHECK_URL = "https://mayhulika.mmda.gov.ph/check-for-violations/m/plate-no";

export const Route = createFileRoute("/pay")({
  head: () => ({
    meta: [
      { title: "Pay a Violation Ticket | NCAS" },
      {
        name: "description",
        content: "Check a vehicle plate for violations through the MMDA May Huli Ka service.",
      },
    ],
  }),
  component: Pay,
});

function Pay() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:py-14">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to NCAS
      </Link>

      <div className="mx-auto mt-8 max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          <Globe2 className="size-3.5" /> MMDA online service
        </span>
        <h1 className="text-display mt-5 text-4xl font-bold sm:text-5xl">Pay a violation ticket</h1>
        <p className="mt-4 text-muted-foreground">
          Check for violations by vehicle plate number through the MMDA May Huli Ka service.
        </p>
      </div>

      <section className="surface-panel mx-auto mt-10 max-w-6xl overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
                  May Huli Ka
                </p>
                <h2 className="mt-1 text-xl font-semibold">Check for violations by plate number</h2>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
              The MMDA service below handles the plate-number lookup. Use the button to open the
              same page in a separate tab if the embedded service does not load.
            </p>
          </div>
          <a
            href={MMDA_PLATE_CHECK_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Open MMDA page <ExternalLink className="size-4" />
          </a>
        </div>

        <div className="bg-secondary/30 p-2 sm:p-3">
          <iframe
            title="MMDA May Huli Ka check for violations by plate number"
            src={MMDA_PLATE_CHECK_URL}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-[78vh] min-h-[680px] w-full rounded-lg border border-border bg-background"
          />
        </div>

        <p className="border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-6">
          This service is provided by mayhulika.mmda.gov.ph. NCAS does not collect or store
          information entered into the external MMDA page.
        </p>
      </section>
    </div>
  );
}
