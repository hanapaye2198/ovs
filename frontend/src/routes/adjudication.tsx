import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/adjudication")({
  head: () => ({
    meta: [
      { title: "Adjudication Status | NCAS" },
      {
        name: "description",
        content:
          "Record the plate, registered owner, notice status, hearing schedule, adjudication officer, and resolution file.",
      },
    ],
  }),
  component: AdjudicationStatus,
});

const modules = [
  { label: "Report ticket", to: "/report" },
  { label: "Ticket violation management", to: "/violations" },
  { label: "Request data", to: "/request" },
  { label: "Adjudication status", to: "/adjudication" },
  { label: "Payment status", to: "/payment-status" },
  { label: "User management" },
  { label: "General settings" },
] as const;

function AdjudicationStatus() {
  const [plateNumber, setPlateNumber] = useState("LDL 202");
  const [registeredOwner, setRegisteredOwner] = useState("");
  const [noticeStatus, setNoticeStatus] = useState("");
  const [hearingSchedule, setHearingSchedule] = useState("");
  const [officer, setOfficer] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? "");
    setSaved(false);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fileName) {
      setError("Upload the resolution PDF before saving this status.");
      setSaved(false);
      return;
    }
    setError("");
    setSaved(true);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-text">
          Hearing record
        </p>
        <h1 className="text-display mt-3 text-4xl font-bold">Adjudication status</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sample hearing form for plate LDL 202. Saving stays in the browser and is not sent to
          the server.
        </p>
      </div>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <nav className="space-y-3 text-sm font-semibold uppercase tracking-wide">
          {modules.map((item) =>
            "to" in item ? (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "block rounded-md px-3 py-2 hover:bg-secondary",
                  item.to === "/adjudication" ? "bg-secondary text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <p key={item.label} className="px-3 py-2 text-muted-foreground/70">
                {item.label}
              </p>
            ),
          )}
        </nav>

        <form onSubmit={handleSubmit} className="max-w-xl space-y-6 text-sm sm:text-base">
          <Field label="Plate no.">
            <input
              value={plateNumber}
              onChange={(event) => setPlateNumber(event.target.value)}
              required
              aria-label="Plate number"
              className="w-full bg-transparent font-medium uppercase outline-none"
            />
          </Field>
          <Field label="Registered owner">
            <input
              value={registeredOwner}
              onChange={(event) => setRegisteredOwner(event.target.value)}
              placeholder="________________"
              aria-label="Registered owner"
              className="w-full bg-transparent outline-none placeholder:tracking-widest"
            />
          </Field>
          <Field label="Notice status">
            <input
              value={noticeStatus}
              onChange={(event) => setNoticeStatus(event.target.value)}
              placeholder="________________"
              aria-label="Notice status"
              className="w-full bg-transparent outline-none placeholder:tracking-widest"
            />
          </Field>
          <Field label="Schedule of hearing">
            <input
              value={hearingSchedule}
              onChange={(event) => setHearingSchedule(event.target.value)}
              placeholder="________________"
              aria-label="Schedule of hearing"
              className="w-full bg-transparent outline-none placeholder:tracking-widest"
            />
          </Field>
          <Field label="Adjudication officer">
            <input
              value={officer}
              onChange={(event) => setOfficer(event.target.value)}
              placeholder="________________"
              aria-label="Adjudication officer"
              className="w-full bg-transparent outline-none placeholder:tracking-widest"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center">
            <span className="font-semibold uppercase tracking-wide">Resolution file</span>
            <label className="inline-flex cursor-pointer items-center gap-2 border-b border-foreground/25 pb-1">
              <span>{fileName || "pdf file*"}</span>
              <span className="rounded-md border border-foreground/30 px-2 py-0.5 text-xs uppercase tracking-wide">
                Upload
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFile}
                className="sr-only"
                aria-label="Upload resolution PDF"
              />
            </label>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {saved ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" />
              Adjudication status saved for this demo.
            </p>
          ) : null}

          <Button type="submit">Save status</Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-3 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-baseline">
      <span className="font-semibold uppercase tracking-wide">{label}</span>
      <span className="border-b border-foreground/25 pb-1">{children}</span>
    </label>
  );
}
