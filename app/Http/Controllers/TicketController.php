<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Violation;
use App\Support\Records;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TicketController extends Controller
{
    public function lookup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ticket_number' => ['required', 'string', 'min:4', 'max:40'],
        ]);

        $ticketNumber = strtoupper(trim($data['ticket_number']));
        $violation = Violation::query()->where('ticket_number', $ticketNumber)->first();

        return response()->json([
            'ticket' => $violation ? Records::publicTicket($violation) : null,
        ]);
    }

    public function byPlate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'vehicle_plate' => ['required', 'string', 'min:2', 'max:20'],
            'mv_file_number' => ['required', 'string', 'min:2', 'max:40'],
        ]);

        $plate = Records::normalizePlate($data['vehicle_plate']);
        $mvFileNumber = Records::normalizeFile($data['mv_file_number']);
        $violations = Violation::query()
            ->where('vehicle_plate', $plate)
            ->where('mv_file_number', $mvFileNumber)
            ->orderByDesc('issued_at')
            ->get();

        return response()->json([
            'tickets' => $violations->map(fn (Violation $violation) => Records::publicTicket($violation))->values(),
        ]);
    }

    public function settle(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ticket_number' => ['required', 'string', 'min:4', 'max:40'],
            'channel' => ['required', 'string', 'min:2', 'max:60'],
            'email' => ['required', 'email', 'max:120'],
        ]);

        $result = DB::transaction(function () use ($data) {
            $ticketNumber = strtoupper(trim($data['ticket_number']));
            $violation = Violation::query()
                ->where('ticket_number', $ticketNumber)
                ->lockForUpdate()
                ->first();

            if (! $violation) {
                return response()->json(['message' => 'Ticket not found.'], 404);
            }

            if ($violation->status !== 'unpaid') {
                return response()->json(['message' => 'This ticket is not open for payment.'], 422);
            }

            $reference = 'SP'.strtoupper(base_convert((string) (int) (microtime(true) * 1000), 10, 36)).random_int(100, 999);

            Payment::create([
                'violation_id' => $violation->id,
                'amount' => $violation->fine_amount,
                'channel' => trim($data['channel']),
                'reference' => $reference,
                'payer_email' => strtolower($data['email']),
                'status' => 'completed',
                'paid_at' => now(),
            ]);

            if (! $violation->citizen_email) {
                $violation->citizen_email = strtolower($data['email']);
            }

            $violation->status = 'paid';
            $violation->save();

            return response()->json([
                'reference' => $reference,
                'amount' => (float) $violation->fine_amount,
                'channel' => trim($data['channel']),
                'ticketNumber' => $ticketNumber,
                'paidAt' => now()->toISOString(),
            ]);
        });

        return $result;
    }
}
