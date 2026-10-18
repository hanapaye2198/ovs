import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/responses")({
  head: () => ({
    meta: [
      { title: "Response Request Info | NCAS" },
      {
        name: "description",
        content:
          "Respond to an information request with the plate, owner, address, CR number, case, and CCTV file.",
      },
    ],
  }),
  component: ResponseRequestInfo,
});

const remarks = [
  { plateNumber: "LDL 202", date: "09-08-26", status: "Pending" },
  { plateNumber: "LAM 153", date: "07-29-26", status: "Available" },
  { plateNumber: "LAX 350", date: "08-20-26", status: "Available" },
] as const;

function ResponseRequestInfo() {
  const [plateNumber, setPlateNumber] = useState("LDL 202");
  const [owner, setOwner] = useState("Joseph Santos");
  const [address, setAddress] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [suspectedCase, setSuspectedCase] = useState("Reckless Imprudence");
  const [submittedBy, setSubmittedBy] = useState("");
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
      setError("Upload the CCTV PDF before sending this response.");
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
          Request reply
        </p>
        <h1 className="text-display mt-3 text-4xl font-bold">Response request info</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sample reply for plate LDL 202. Sending stays in the browser and is not sent to the
          server.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]"
      >
        <section className="rounded-[1.75rem] bg-primary px-6 py-8 text-primary-foreground shadow-panel sm:px-8">
          <div className="space-y-5 text-sm sm:text-base">
            <Line label="Plate no.">
              <input
                value={plateNumber}
                onChange={(event) => setPlateNumber(event.target.value)}
                required
                aria-label="Plate number"
                className="w-full bg-transparent font-medium uppercase outline-none"
              />
            </Line>
            <Line label="Registered owner">
              <input
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
                required
                aria-label="Registered owner"
                className="w-full bg-transparent font-medium uppercase outline-none"
              />
            </Line>
            <Line label="Address">
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="________________"
                aria-label="Address"
                className="w-full bg-transparent uppercase outline-none placeholder:tracking-widest placeholder:text-primary-foreground/70"
              />
            </Line>
            <Line label="CR no.">
              <input
                value={crNumber}
                onChange={(event) => setCrNumber(event.target.value)}
                placeholder="________________"
                aria-label="CR number"
                className="w-full bg-transparent uppercase outline-none placeholder:tracking-widest placeholder:text-primary-foreground/70"
              />
            </Line>
            <Line label="Suspected case">
              <input
                value={suspectedCase}
                onChange={(event) => setSuspectedCase(event.target.value)}
                required
                aria-label="Suspected case"
                className="w-full bg-transparent font-medium uppercase outline-none"
              />
            </Line>
            <Line label="Submitted by">
              <input
                value={submittedBy}
                onChange={(event) => setSubmittedBy(event.target.value)}
                placeholder="________________"
                aria-label="Submitted by"
                className="w-full bg-transparent uppercase outline-none placeholder:tracking-widest placeholder:text-primary-foreground/70"
              />
            </Line>
            <div className="grid gap-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
              <span className="font-semibold uppercase tracking-wide">CCTV video file</span>
              <label className="inline-flex cursor-pointer items-center gap-2 border-b border-primary-foreground/30 pb-1">
                <span>{fileName || "pdf file*"}</span>
                <span className="rounded-md border border-primary-foreground/40 px-2 py-0.5 text-xs uppercase tracking-wide">
                  Upload
                </span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFile}
                  className="sr-only"
                  aria-label="Upload CCTV PDF"
                />
              </label>
            </div>
          </div>

          {error ? <p className="mt-6 text-sm text-destructive-foreground">{error}</p> : null}
          {saved ? (
            <p className="mt-6 flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="size-4" />
              Response saved for this demo.
            </p>
          ) : null}

          <Button type="submit" variant="secondary" className="mt-8">
            Send response
          </Button>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Remarks</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {remarks.map((item) => (
                <tr key={item.plateNumber}>
                  <td className="py-2 font-medium">{item.plateNumber}</td>
                  <td className="py-2">{item.date}</td>
                  <td className="py-2">
                    <StatusPill status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </form>
    </div>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-baseline">
      <span className="font-semibold uppercase tracking-wide">{label}:</span>
      <span className="border-b border-primary-foreground/25 pb-1">{children}</span>
    </label>
  );
}

function StatusPill({ status }: { status: "Pending" | "Available" }) {
  const pending = status === "Pending";
  return (
    <span
      className={
        pending
          ? "inline-flex min-w-20 justify-center rounded-md bg-warning px-2.5 py-1 text-xs font-semibold text-warning-foreground"
          : "inline-flex min-w-20 justify-center rounded-md bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white"
      }
    >
      {status}
    </span>
  );
}
