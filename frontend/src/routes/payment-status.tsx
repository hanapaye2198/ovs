import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/payment-status")({
  head: () => ({
    meta: [
      { title: "Payment Status | NCAS" },
      {
        name: "description",
        content: "Review sample ticket payment status, registered owners, and fines.",
      },
    ],
  }),
  component: PaymentStatus,
});

const payments = [
  {
    ticketNumber: "TGM 000081526",
    plateNumber: "LDL 202",
    reportedOn: "August 15, 2026",
    owner: "Joseph Santos",
    status: "Not Paid",
    fine: "Php 1,500.00",
    flaggedOwner: false,
  },
  {
    ticketNumber: "TGM 000072326",
    plateNumber: "LAM 153",
    reportedOn: "July 7, 2026",
    owner: "Maria Pablo",
    status: "Paid",
    fine: "Php 2,300.00",
    flaggedOwner: false,
  },
  {
    ticketNumber: "TGM 000040426",
    plateNumber: "LAX 190",
    reportedOn: "July 7, 2026",
    owner: "Nilo Cabral",
    status: "Paid",
    fine: "Php 3,600.00",
    flaggedOwner: true,
  },
] as const;

function PaymentStatus() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-text">
          Collections
        </p>
        <h1 className="text-display mt-3 text-4xl font-bold">Payment status</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sample payment records for the demo. These rows are not loaded from the server.
        </p>
      </div>

      <section className="surface-panel mt-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-secondary/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Ticket No</th>
                <th className="px-4 py-3 font-semibold">Plate No</th>
                <th className="px-4 py-3 font-semibold">Date of Report</th>
                <th className="px-4 py-3 font-semibold">Registered Owner</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Fine</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.ticketNumber} className="border-b border-border last:border-0">
                  <td className="px-4 py-4 font-medium">{payment.ticketNumber}</td>
                  <td className="px-4 py-4">{payment.plateNumber}</td>
                  <td className="px-4 py-4">{payment.reportedOn}</td>
                  <td
                    className={
                      payment.flaggedOwner ? "px-4 py-4 font-medium text-destructive" : "px-4 py-4"
                    }
                  >
                    {payment.owner}
                  </td>
                  <td className="px-4 py-4">{payment.status}</td>
                  <td className="px-4 py-4">{payment.fine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
