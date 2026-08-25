import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const lookupSchema = z.object({ ticketNumber: z.string().trim().min(4).max(40) });

const paySchema = z.object({
  ticketNumber: z.string().trim().min(4).max(40),
  channel: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(120),
});

export type PublicTicket = {
  ticket_number: string;
  violator_name: string;
  violation_type: string;
  ordinance_code: string | null;
  fine_amount: number;
  location: string | null;
  issued_at: string;
  status: string;
  vehicle_plate: string | null;
};

function maskName(name: string) {
  return name
    .split(" ")
    .map((part) =>
      part.length <= 2
        ? part
        : `${part.slice(0, 1)}${"*".repeat(Math.max(part.length - 2, 1))}${part.slice(-1)}`,
    )
    .join(" ");
}

/** Public: returns a single ticket, only on an exact ticket-number match. */
export const lookupTicket = createServerFn({ method: "POST" })
  .validator((input: unknown) => lookupSchema.parse(input))
  .handler(async ({ data }): Promise<{ ticket: PublicTicket | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("violations")
      .select(
        "ticket_number, violator_name, violation_type, ordinance_code, fine_amount, location, issued_at, status, vehicle_plate",
      )
      .eq("ticket_number", data.ticketNumber.toUpperCase())
      .maybeSingle();

    if (error) throw new Error("Unable to look up that ticket right now.");
    if (!row) return { ticket: null };

    return {
      ticket: {
        ...row,
        fine_amount: Number(row.fine_amount),
        violator_name: maskName(row.violator_name),
      },
    };
  });

/** Public: simulated payment gateway settlement for a single ticket. */
export const settleTicket = createServerFn({ method: "POST" })
  .validator((input: unknown) => paySchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ticketNumber = data.ticketNumber.toUpperCase();

    const { data: row, error } = await supabaseAdmin
      .from("violations")
      .select("id, fine_amount, status")
      .eq("ticket_number", ticketNumber)
      .maybeSingle();

    if (error) throw new Error("Payment could not be processed.");
    if (!row) throw new Error("Ticket not found.");
    if (row.status !== "unpaid") throw new Error("This ticket is not open for payment.");

    const reference = `SP${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;

    const { error: payError } = await supabaseAdmin.from("payments").insert({
      violation_id: row.id,
      amount: row.fine_amount,
      channel: data.channel,
      reference,
      payer_email: data.email,
      status: "completed",
    });
    if (payError) throw new Error("Payment could not be recorded.");

    await supabaseAdmin.from("violations").update({ status: "paid" }).eq("id", row.id);

    return {
      reference,
      amount: Number(row.fine_amount),
      channel: data.channel,
      ticketNumber,
      paidAt: new Date().toISOString(),
    };
  });

export type CitizenPayment = {
  reference: string;
  amount: number;
  channel: string;
  status: string;
  paidAt: string;
  ticketNumber: string;
  violationType: string;
};

/** Authenticated citizen view: returns only settlements made with the signed-in user's email. */
export const getCitizenPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ payments: CitizenPayment[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );

    if (userError || !authUser.user?.email) {
      throw new Error("Unable to load your citizen account.");
    }

    const { data: paymentRows, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("reference, amount, channel, status, paid_at, violation_id")
      .eq("payer_email", authUser.user.email)
      .order("paid_at", { ascending: false })
      .limit(20);

    if (paymentError) throw new Error("Unable to load your payment history.");
    if (!paymentRows?.length) return { payments: [] };

    const violationIds = paymentRows.map((payment) => payment.violation_id);
    const { data: violationRows, error: violationError } = await supabaseAdmin
      .from("violations")
      .select("id, ticket_number, violation_type")
      .in("id", violationIds);

    if (violationError) throw new Error("Unable to load your ticket history.");

    const violationById = new Map(
      (violationRows ?? []).map((violation) => [
        violation.id,
        { ticketNumber: violation.ticket_number, violationType: violation.violation_type },
      ]),
    );

    return {
      payments: paymentRows.map((payment) => {
        const violation = violationById.get(payment.violation_id);
        return {
          reference: payment.reference,
          amount: Number(payment.amount),
          channel: payment.channel,
          status: payment.status,
          paidAt: payment.paid_at,
          ticketNumber: violation?.ticketNumber ?? "Unknown ticket",
          violationType: violation?.violationType ?? "Ordinance violation",
        };
      }),
    };
  });
