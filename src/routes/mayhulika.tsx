import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Globe2, ShieldCheck } from "lucide-react";

const MAY_HULI_KA_URL = "https://mayhulika.mmda.gov.ph/";

export const Route = createFileRoute("/mayhulika")({
  head: () => ({
    meta: [
      { title: "May Huli Ka — MMDA Portal | OVS" },
      {
        name: "description",
        content: "Access the MMDA May Huli Ka portal from the Ordinance Violation System.",
      },
      { property: "og:title", content: "May Huli Ka — MMDA Portal" },
      {
        property: "og:description",
        content: "A dedicated OVS section for accessing the MMDA May Huli Ka portal.",
      },
    ],
  }),
  component: MayHuliKa,
});

function MayHuliKa() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          <Globe2 className="size-3.5" /> Partner service
        </span>
        <h1 className="text-display mt-5 text-4xl font-bold sm:text-5xl">May Huli Ka</h1>
        <p className="mt-4 text-muted-foreground">
          Access the MMDA May Huli Ka portal in its own dedicated OVS section. The service is
          operated by the Metropolitan Manila Development Authority.
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
                  MMDA portal
                </p>
                <h2 className="mt-1 text-xl font-semibold">May Huli Ka online service</h2>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
              Use the embedded service below, or open it in a separate browser tab if the external
              page does not load inside this frame.
            </p>
          </div>
          <a
            href={MAY_HULI_KA_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Open in new tab <ExternalLink className="size-4" />
          </a>
        </div>

        <div className="bg-secondary/30 p-2 sm:p-3">
          <iframe
            title="MMDA May Huli Ka portal"
            src={MAY_HULI_KA_URL}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-[78vh] min-h-[620px] w-full rounded-lg border border-border bg-background"
          />
        </div>

        <p className="border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-6">
          This embedded page is provided by mayhulika.mmda.gov.ph. OVS does not collect or store
          information entered into the external MMDA service.
        </p>
      </section>
    </div>
  );
}
