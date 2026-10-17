<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Violation;
use App\Support\Records;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CitizenController extends Controller
{
    public function payments(Request $request): JsonResponse
    {
        $email = strtolower((string) $request->user()->email);

        $payments = Payment::query()
            ->with('violation')
            ->where('payer_email', $email)
            ->orderByDesc('paid_at')
            ->limit(20)
            ->get();

        return response()->json([
            'payments' => $payments->map(fn (Payment $payment) => Records::citizenPayment($payment))->values(),
        ]);
    }

    public function tickets(Request $request): JsonResponse
    {
        $email = strtolower((string) $request->user()->email);

        $violations = Violation::query()
            ->where('citizen_email', $email)
            ->orderByDesc('issued_at')
            ->get();

        return response()->json([
            'tickets' => $violations->map(fn (Violation $violation) => Records::publicTicket($violation))->values(),
        ]);
    }
}
