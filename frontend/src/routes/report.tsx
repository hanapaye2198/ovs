import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import trafficGrab from "@/assets/edsa-traffic-xl-f14437c9.png";
import { Button } from "@/components/ui/button";

/** Mixkit free stock clip of aerial night traffic, used as the demo video file. */
const DEMO_VIDEO = "/demo/cctv-night-traffic.mp4";
const DEMO_VIDEO_NAME = "cctv-night-traffic.mp4";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report Ticket | NCAS" },
      {
        name: "description",
        content:
          "File a demo report ticket with the plate number, reporting officer, CCTV reference, and video screen grab.",
      },
    ],
  }),
  component: ReportTicket,
});

type PreviewKind = "image" | "video";

function ReportTicket() {
  const [ticketNumber, setTicketNumber] = useState("TGM 0000101926");
  const [plateNumber, setPlateNumber] = useState("LDL 202");
  const [reportedBy, setReportedBy] = useState("Ruel Lim");
  const [approvedBy, setApprovedBy] = useState("");
  const [suspectedCase, setSuspectedCase] = useState("");
  const [cctvReference, setCctvReference] = useState("");
  const [fileName, setFileName] = useState(DEMO_VIDEO_NAME);
  const [previewUrl, setPreviewUrl] = useState<string | null>(DEMO_VIDEO);
  const [previewKind, setPreviewKind] = useState<PreviewKind | null>("video");
  const [error, setError] = useState("");
  const [filed, setFiled] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);

    if (!file) {
      setFileName(DEMO_VIDEO_NAME);
      setPreviewUrl(DEMO_VIDEO);
      setPreviewKind("video");
      return;
    }

    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewKind(file.type.startsWith("video/") ? "video" : "image");
    setFiled(false);
    setError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fileName) {
      setError("Upload the video file before filing this report.");
      setFiled(false);
      return;
    }
    setError("");
    setFiled(true);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 lg:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-text">
          Field report
        </p>
        <h1 className="text-display mt-3 text-4xl font-bold">Report a ticket</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Record the citation, the officer, and the CCTV screen grab. This demo stays in the
          browser and is not sent to the server.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]"
      >
        <section className="rounded-[1.75rem] bg-secondary px-6 py-10 text-secondary-foreground shadow-panel sm:px-10">
          <h2 className="text-center font-display text-xl font-bold tracking-[0.22em]">
            REPORT TICKET
          </h2>

          <div className="mx-auto mt-10 max-w-xl space-y-5 text-sm sm:text-base">
            <TicketLine label="Ticket no.">
              <input
                value={ticketNumber}
                onChange={(event) => setTicketNumber(event.target.value)}
                required
                aria-label="Ticket number"
                className="w-full bg-transparent font-medium outline-none"
              />
            </TicketLine>
            <TicketLine label="Plate no.">
              <input
                value={plateNumber}
                onChange={(event) => setPlateNumber(event.target.value)}
                required
                aria-label="Plate number"
                className="w-full bg-transparent font-medium uppercase outline-none"
              />
            </TicketLine>
            <TicketLine label="Reported by:">
              <input
                value={reportedBy}
                onChange={(event) => setReportedBy(event.target.value)}
                required
                aria-label="Reported by"
                className="w-full bg-transparent font-medium outline-none"
              />
            </TicketLine>
            <TicketLine label="Approved by:">
              <input
                value={approvedBy}
                onChange={(event) => setApprovedBy(event.target.value)}
                placeholder="________________"
                aria-label="Approved by"
                className="w-full bg-transparent font-medium outline-none placeholder:tracking-widest placeholder:text-secondary-foreground/70"
              />
            </TicketLine>
            <TicketLine label="Suspected Case:">
              <input
                value={suspectedCase}
                onChange={(event) => setSuspectedCase(event.target.value)}
                placeholder="________________"
                aria-label="Suspected case"
                className="w-full bg-transparent font-medium outline-none placeholder:tracking-widest placeholder:text-secondary-foreground/70"
              />
            </TicketLine>
            <TicketLine label="CCTV Reference:">
              <input
                value={cctvReference}
                onChange={(event) => setCctvReference(event.target.value)}
                placeholder="________________"
                aria-label="CCTV reference"
                className="w-full bg-transparent font-medium outline-none placeholder:tracking-widest placeholder:text-secondary-foreground/70"
              />
            </TicketLine>
            <TicketLine label="Video File:">
              <label className="inline-flex cursor-pointer items-center gap-2 font-medium">
                <span>{fileName || "File link*"}</span>
                <span className="rounded-md border border-secondary-foreground/30 px-2 py-0.5 text-xs uppercase tracking-wide">
                  Upload
                </span>
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleFile}
                  className="sr-only"
                  aria-label="Upload video file"
                />
              </label>
            </TicketLine>
          </div>

          {error ? <p className="mt-6 text-center text-sm text-destructive">{error}</p> : null}
          {filed ? (
            <p className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" />
              Report filed for this demo. The screen grab stays on this page.
            </p>
          ) : null}

          <div className="mt-8 flex justify-center">
            <Button type="submit">File report</Button>
          </div>
        </section>

        <aside className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none lg:pt-6">
          <p className="text-center text-sm font-semibold tracking-[0.2em] text-foreground">
            SCREEN GRAB
          </p>
          <div className="mt-4 overflow-hidden rounded-lg shadow-lift">
            {previewKind === "video" && previewUrl ? (
              <video
                src={previewUrl}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="aspect-video w-full bg-black object-cover"
              />
            ) : (
              <img
                src={previewUrl ?? trafficGrab}
                alt="CCTV screen grab of the reported roadway"
                className="aspect-[3/4] w-full object-cover"
              />
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}

function TicketLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] items-baseline gap-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
      <span className="font-semibold">{label}</span>
      <div className="min-w-0 border-b border-secondary-foreground/25 pb-1">{children}</div>
    </div>
  );
}
