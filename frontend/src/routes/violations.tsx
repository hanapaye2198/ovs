import { createFileRoute } from "@tanstack/react-router";
import { Download, Play } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_VIDEO = "/demo/cctv-night-traffic.mp4";

export const Route = createFileRoute("/violations")({
  head: () => ({
    meta: [
      { title: "Ticket Violation Management | NCAS" },
      {
        name: "description",
        content:
          "Review reported violation tickets, play the CCTV file, download a report, and compare top violations.",
      },
    ],
  }),
  component: ViolationManagement,
});

type ReportTicket = {
  ticketNumber: string;
  plateNumber: string;
  reportedOn: string;
  suspectedCase: string;
  reportedBy: string;
};

const reports: ReportTicket[] = [
  {
    ticketNumber: "TGM 000081526",
    plateNumber: "LDL 202",
    reportedOn: "2026-08-15",
    suspectedCase: "Beating Red Light",
    reportedBy: "Ruel Lim",
  },
  {
    ticketNumber: "TGM 000081926",
    plateNumber: "LHL 105",
    reportedOn: "2026-04-18",
    suspectedCase: "Reckless Imprudence",
    reportedBy: "Ruel Lim",
  },
  {
    ticketNumber: "TGM 000082026",
    plateNumber: "LDL 119",
    reportedOn: "2026-03-29",
    suspectedCase: "Illegal U-turn",
    reportedBy: "Ruel Lim",
  },
  {
    ticketNumber: "TGM 000082126",
    plateNumber: "ABC 4412",
    reportedOn: "2026-07-02",
    suspectedCase: "Illegal Parking",
    reportedBy: "Ruel Lim",
  },
  {
    ticketNumber: "TGM 000082226",
    plateNumber: "DEF 7781",
    reportedOn: "2026-06-09",
    suspectedCase: "Obstruction",
    reportedBy: "Ruel Lim",
  },
  {
    ticketNumber: "TGM 000082326",
    plateNumber: "GHI 2204",
    reportedOn: "2026-05-21",
    suspectedCase: "Disregarding Traffic Signs",
    reportedBy: "Ruel Lim",
  },
  {
    ticketNumber: "TGM 000082426",
    plateNumber: "JKL 9090",
    reportedOn: "2026-08-03",
    suspectedCase: "No Helmet",
    reportedBy: "Ruel Lim",
  },
];

const violationSamples = [
  { code: "OSD1", name: "Obstruction", date: "2026-03-15", count: 820 },
  { code: "OSD1", name: "Obstruction", date: "2026-04-15", count: 1100 },
  { code: "OSD1", name: "Obstruction", date: "2026-06-15", count: 980 },
  { code: "OSD1", name: "Obstruction", date: "2026-08-15", count: 1300 },
  { code: "OSD2", name: "Disregarding Traffic Signs", date: "2026-03-20", count: 700 },
  { code: "OSD2", name: "Disregarding Traffic Signs", date: "2026-05-12", count: 900 },
  { code: "OSD2", name: "Disregarding Traffic Signs", date: "2026-07-08", count: 1100 },
  { code: "OSD2", name: "Disregarding Traffic Signs", date: "2026-08-18", count: 1100 },
  { code: "OSD3", name: "Beating Red Light", date: "2026-04-02", count: 600 },
  { code: "OSD3", name: "Beating Red Light", date: "2026-05-19", count: 800 },
  { code: "OSD3", name: "Beating Red Light", date: "2026-07-22", count: 900 },
  { code: "OSD3", name: "Beating Red Light", date: "2026-08-15", count: 800 },
  { code: "OSD4", name: "Reckless Imprudence", date: "2026-03-11", count: 400 },
  { code: "OSD4", name: "Reckless Imprudence", date: "2026-04-18", count: 700 },
  { code: "OSD4", name: "Reckless Imprudence", date: "2026-06-28", count: 600 },
  { code: "OSD4", name: "Reckless Imprudence", date: "2026-08-09", count: 700 },
  { code: "OSD5", name: "Illegal U-turn", date: "2026-03-29", count: 300 },
  { code: "OSD5", name: "Illegal U-turn", date: "2026-05-04", count: 500 },
  { code: "OSD5", name: "Illegal U-turn", date: "2026-06-16", count: 500 },
  { code: "OSD5", name: "Illegal U-turn", date: "2026-07-30", count: 500 },
  { code: "OSD6", name: "Illegal Parking", date: "2026-04-07", count: 200 },
  { code: "OSD6", name: "Illegal Parking", date: "2026-05-25", count: 300 },
  { code: "OSD6", name: "Illegal Parking", date: "2026-07-02", count: 400 },
  { code: "OSD6", name: "Illegal Parking", date: "2026-08-21", count: 300 },
  { code: "OSD7", name: "No Helmet", date: "2026-03-08", count: 150 },
  { code: "OSD7", name: "No Helmet", date: "2026-05-14", count: 250 },
  { code: "OSD7", name: "No Helmet", date: "2026-06-19", count: 250 },
  { code: "OSD7", name: "No Helmet", date: "2026-08-03", count: 250 },
];

const chartScale = 5000;

function ViolationManagement() {
  const [playing, setPlaying] = useState<ReportTicket | null>(null);
  const [copiedTicket, setCopiedTicket] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("2026-03-01");
  const [toDate, setToDate] = useState("2026-08-31");

  async function copyFileLink(ticketNumber: string) {
    const link = new URL(DEMO_VIDEO, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const area = document.createElement("textarea");
      area.value = link;
      area.setAttribute("readonly", "");
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopiedTicket(ticketNumber);
    window.setTimeout(() => {
      setCopiedTicket((current) => (current === ticketNumber ? null : current));
    }, 1500);
  }

  const topViolations = useMemo(() => {
    const totals = new Map<string, { code: string; name: string; count: number }>();
    for (const sample of violationSamples) {
      if (fromDate && sample.date < fromDate) continue;
      if (toDate && sample.date > toDate) continue;
      const current = totals.get(sample.code) ?? {
        code: sample.code,
        name: sample.name,
        count: 0,
      };
      current.count += sample.count;
      totals.set(sample.code, current);
    }
    return [...totals.values()].sort((left, right) => right.count - left.count);
  }, [fromDate, toDate]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 lg:py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-text">
          LGU records
        </p>
        <h1 className="text-display mt-3 text-4xl font-bold">Violation management</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sample reported tickets for the demo. Play opens the CCTV clip, and download saves a
          report on this device. Nothing is sent to the server.
        </p>
      </div>

      <section className="surface-panel mt-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border bg-secondary/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Ticket No.</th>
                <th className="px-4 py-3 font-semibold">Plate No.</th>
                <th className="px-4 py-3 font-semibold">Date of Report</th>
                <th className="px-4 py-3 font-semibold">Suspected Case</th>
                <th className="px-4 py-3 font-semibold">Reported by</th>
                <th className="px-4 py-3 font-semibold">File link</th>
                <th className="px-4 py-3 font-semibold">Download Report</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((ticket) => (
                <tr key={ticket.ticketNumber} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{ticket.ticketNumber}</td>
                  <td className="px-4 py-3">{ticket.plateNumber}</td>
                  <td className="px-4 py-3">{formatReportDate(ticket.reportedOn)}</td>
                  <td className="px-4 py-3">{ticket.suspectedCase}</td>
                  <td className="px-4 py-3">{ticket.reportedBy}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-left text-primary underline-offset-2 hover:underline"
                        onClick={() => void copyFileLink(ticket.ticketNumber)}
                      >
                        {copiedTicket === ticket.ticketNumber ? "Copied" : "http://video*"}
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 bg-destructive px-2 text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => setPlaying(ticket)}
                      >
                        <Play className="size-3.5" /> Play
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => downloadReport(ticket)}>
                      <Download className="size-3.5" /> PDF File
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {playing ? (
        <section className="surface-panel mt-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
                File link
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                {playing.ticketNumber} · {playing.plateNumber}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{playing.suspectedCase}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setPlaying(null)}>
              Close
            </Button>
          </div>
          <video
            key={playing.ticketNumber}
            src={DEMO_VIDEO}
            controls
            autoPlay
            className="mt-4 aspect-video w-full rounded-lg bg-black"
          />
        </section>
      ) : null}

      <section className="surface-panel mt-6 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Top violations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Example counts for the suspected cases in this demo.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="violation-from" className="text-xs uppercase tracking-wide">
                From
              </Label>
              <Input
                id="violation-from"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="mt-1 w-40"
              />
            </div>
            <div>
              <Label htmlFor="violation-to" className="text-xs uppercase tracking-wide">
                To
              </Label>
              <Input
                id="violation-to"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="mt-1 w-40"
              />
            </div>
          </div>
        </div>

        {topViolations.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            No sample violations fall inside that date range.
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            {topViolations.map((item) => (
              <div key={item.code} className="grid items-center gap-3 sm:grid-cols-[220px_minmax(0,1fr)_4rem]">
                <p className="text-sm">
                  <span className="font-semibold">{item.code}</span>
                  <span className="text-muted-foreground"> — {item.name}</span>
                </p>
                <div className="h-6 overflow-hidden rounded-sm bg-secondary">
                  <div
                    className="h-full rounded-sm bg-primary"
                    style={{ width: `${Math.min(100, (item.count / chartScale) * 100)}%` }}
                  />
                </div>
                <p className="text-right text-sm font-medium tabular-nums">{item.count.toLocaleString()}</p>
              </div>
            ))}
            <div className="grid grid-cols-6 pt-2 text-xs text-muted-foreground">
              {[0, 1000, 2000, 3000, 4000, 5000].map((tick) => (
                <span key={tick} className={tick === 0 ? "" : "text-right"}>
                  {tick.toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function formatReportDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function downloadReport(ticket: ReportTicket) {
  const pdf = buildSimplePdf([
    "NCAS VIOLATION REPORT",
    `Ticket No: ${ticket.ticketNumber}`,
    `Plate No: ${ticket.plateNumber}`,
    `Date of Report: ${formatReportDate(ticket.reportedOn)}`,
    `Suspected Case: ${ticket.suspectedCase}`,
    `Reported by: ${ticket.reportedBy}`,
    "File link: demo CCTV clip",
    "Demo copy. This file was created in the browser.",
  ]);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${ticket.ticketNumber.replace(/\s/g, "-")}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildSimplePdf(lines: string[]) {
  const commands = ["BT", "/F1 12 Tf", "72 740 Td"];
  lines.forEach((line, index) => {
    if (index > 0) commands.push("0 -22 Td");
    commands.push(`(${escapePdf(line)}) Tj`);
  });
  commands.push("ET");
  const stream = commands.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function escapePdf(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
