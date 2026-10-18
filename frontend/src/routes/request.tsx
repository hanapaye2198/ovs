import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Play } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const DEMO_VIDEO = "/demo/cctv-night-traffic.mp4";

export const Route = createFileRoute("/request")({
  head: () => ({
    meta: [
      { title: "Request Information | NCAS" },
      {
        name: "description",
        content:
          "Review information requests by plate number, vehicle type, description, date, and status.",
      },
    ],
  }),
  component: RequestInformation,
});

type RequestStatus = "Pending" | "Available";

type InformationRequest = {
  plateNumber: string;
  vehicleType: string;
  description: string;
  date: string;
  status: RequestStatus;
  registeredOwner: string;
  suspectedCase: string;
  captureDate: string;
  captureTime: string;
  reportedBy: string;
  requestedBy: string;
};

const requests: InformationRequest[] = [
  {
    plateNumber: "LDL 202",
    vehicleType: "Sedan",
    description: "Reckless Imprudence",
    date: "09-08-26",
    status: "Pending",
    registeredOwner: "",
    suspectedCase: "Reckless Imprudence",
    captureDate: "10-02-26",
    captureTime: "Time stamped",
    reportedBy: "Ruel Lim",
    requestedBy: "Ruel Lim",
  },
  {
    plateNumber: "LAM 153",
    vehicleType: "Motorcycle",
    description: "Beating Red Light",
    date: "07-29-26",
    status: "Available",
    registeredOwner: "Maria Santos",
    suspectedCase: "Beating Red Light",
    captureDate: "07-28-26",
    captureTime: "Time stamped",
    reportedBy: "Ruel Lim",
    requestedBy: "Ruel Lim",
  },
  {
    plateNumber: "LAX 350",
    vehicleType: "SUV",
    description: "Illegal U-turn",
    date: "08-20-26",
    status: "Available",
    registeredOwner: "Pedro Reyes",
    suspectedCase: "Illegal U-turn",
    captureDate: "08-19-26",
    captureTime: "Time stamped",
    reportedBy: "Ruel Lim",
    requestedBy: "Ruel Lim",
  },
];

function RequestInformation() {
  const [selected, setSelected] = useState<InformationRequest | null>(null);
  const [playing, setPlaying] = useState(false);

  if (selected) {
    return (
      <RequestDetail
        request={selected}
        playing={playing}
        onPlay={() => setPlaying(true)}
        onBack={() => {
          setSelected(null);
          setPlaying(false);
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-text">
          Information requests
        </p>
        <h1 className="text-display mt-3 text-4xl font-bold">Request information</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sample requests for the demo. View opens the plate record, CCTV file, and remarks.
          Nothing is sent to the server.
        </p>
      </div>

      <section className="surface-panel mt-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-secondary/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Plate no.</th>
                <th className="px-4 py-3 font-semibold">Vehicle type</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.plateNumber} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{request.plateNumber}</td>
                  <td className="px-4 py-3">{request.vehicleType}</td>
                  <td className="px-4 py-3">{request.description}</td>
                  <td className="px-4 py-3">{request.date}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={request.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Button type="button" size="sm" onClick={() => setSelected(request)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RequestDetail({
  request,
  playing,
  onPlay,
  onBack,
}: {
  request: InformationRequest;
  playing: boolean;
  onPlay: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:py-14">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back to requests
        </Button>
        <Button asChild size="sm">
          <Link to="/responses">Respond</Link>
        </Button>
      </div>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <section className="rounded-[1.75rem] bg-primary px-6 py-8 text-primary-foreground shadow-panel sm:px-8">
          <dl className="space-y-4 text-sm sm:text-base">
            <DetailLine label="Plate no." value={request.plateNumber} />
            <DetailLine label="Vehicle type" value={request.vehicleType} />
            <DetailLine label="Registered owner" value={request.registeredOwner || "________________"} />
            <DetailLine label="Suspected case" value={request.suspectedCase} />
            <DetailLine label="Date of CCTV capture" value={request.captureDate} />
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <DetailLine label="Time" value={request.captureTime} />
              <div className="flex items-center gap-2 sm:justify-end">
                <span className="text-sm font-semibold uppercase tracking-wide">Video file: *Link</span>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 bg-destructive px-2 text-destructive-foreground hover:bg-destructive/90"
                  onClick={onPlay}
                >
                  <Play className="size-3.5" /> Play
                </Button>
              </div>
            </div>
            <DetailLine label="Reported by" value={request.reportedBy} />
            <DetailLine label="Information requested by" value={request.requestedBy} />
          </dl>
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
              {requests.map((item) => (
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
      </div>

      {playing ? (
        <video
          src={DEMO_VIDEO}
          controls
          autoPlay
          className="mt-6 aspect-video w-full max-w-3xl rounded-lg bg-black"
        />
      ) : null}
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      <dt className="font-semibold uppercase tracking-wide">{label}:</dt>
      <dd className="uppercase">{value}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: RequestStatus }) {
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
