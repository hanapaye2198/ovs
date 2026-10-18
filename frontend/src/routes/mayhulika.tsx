import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/mayhulika")({
  head: () => ({
    meta: [
      { title: "Traffic Management Office | NCAS" },
      {
        name: "description",
        content: "Access the native Tagum City Traffic Management Office lookup from NCAS.",
      },
      { property: "og:title", content: "Tagum City Traffic Management Office" },
      {
        property: "og:description",
        content: "A native NCAS section for the Tagum City Traffic Management Office lookup.",
      },
    ],
  }),
  component: TrafficManagementOffice,
});

function TrafficManagementOffice() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:py-14">
      <section className="surface-panel mx-auto max-w-6xl overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-border p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
                  Traffic management service
                </p>
                <h2 className="mt-1 text-xl font-semibold">Tagum City Traffic Management Office</h2>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
              The violation lookup is now available as a native NCAS demo and does not redirect to
              an external portal.
            </p>
          </div>
          <Link
            to="/pay"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Open native lookup
          </Link>
        </div>

        <p className="border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-6">
          All interactions on this section stay inside the NCAS demo workspace.
        </p>
      </section>
    </div>
  );
}
