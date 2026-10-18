<?php

namespace App\Support;

use App\Models\Payment;
use App\Models\SupportRequest;
use App\Models\Violation;

class Records
{
    public static function normalizePlate(?string $value): string
    {
        $collapsed = preg_replace('/\s+/', ' ', trim((string) $value)) ?? '';

        return mb_strtoupper($collapsed);
    }

    public static function normalizeFile(?string $value): string
    {
        return mb_strtoupper(trim((string) $value));
    }

    public static function maskName(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];

        return collect($parts)
            ->filter(fn (string $part) => $part !== '')
            ->map(function (string $part) {
                $length = mb_strlen($part);
                if ($length <= 2) {
                    return $part;
                }

                return mb_substr($part, 0, 1)
                    .str_repeat('*', max($length - 2, 1))
                    .mb_substr($part, -1);
            })
            ->implode(' ');
    }

    public static function publicTicket(Violation $violation): array
    {
        $plate = self::normalizePlate($violation->vehicle_plate);

        return [
            'ticket_number' => $violation->ticket_number,
            'violator_name' => self::maskName($violation->violator_name),
            'violation_type' => $violation->violation_type,
            'ordinance_code' => $violation->ordinance_code,
            'fine_amount' => (float) $violation->fine_amount,
            'location' => $violation->location,
            'issued_at' => $violation->issued_at?->toISOString(),
            'status' => $violation->status,
            'vehicle_plate' => $plate !== '' ? $plate : null,
        ];
    }

    public static function violation(Violation $violation): array
    {
        $plate = self::normalizePlate($violation->vehicle_plate);

        return [
            'id' => (string) $violation->id,
            'ticket_number' => $violation->ticket_number,
            'violator_name' => $violation->violator_name,
            'address' => $violation->address,
            'license_number' => $violation->license_number,
            'vehicle_plate' => $plate !== '' ? $plate : null,
            'mv_file_number' => self::normalizeFile($violation->mv_file_number) ?: null,
            'citizen_email' => $violation->citizen_email,
            'violation_type' => $violation->violation_type,
            'ordinance_code' => $violation->ordinance_code,
            'fine_amount' => (float) $violation->fine_amount,
            'location' => $violation->location,
            'issued_at' => $violation->issued_at?->toISOString(),
            'officer' => $violation->officer,
            'remarks' => $violation->remarks,
            'status' => $violation->status,
            'created_by' => $violation->created_by ? (string) $violation->created_by : null,
            'created_at' => $violation->created_at?->toISOString(),
            'updated_at' => $violation->updated_at?->toISOString(),
        ];
    }

    public static function payment(Payment $payment): array
    {
        return [
            'id' => (string) $payment->id,
            'violation_id' => (string) $payment->violation_id,
            'amount' => (float) $payment->amount,
            'channel' => $payment->channel,
            'reference' => $payment->reference,
            'payer_email' => $payment->payer_email,
            'status' => $payment->status,
            'paid_at' => $payment->paid_at?->toISOString(),
        ];
    }

    public static function citizenPayment(Payment $payment): array
    {
        return [
            'reference' => $payment->reference,
            'amount' => (float) $payment->amount,
            'channel' => $payment->channel,
            'status' => $payment->status,
            'paidAt' => $payment->paid_at?->toISOString(),
            'ticketNumber' => $payment->violation?->ticket_number ?? 'Unknown ticket',
            'violationType' => $payment->violation?->violation_type ?? 'Ordinance violation',
        ];
    }

    public static function supportRequest(SupportRequest $request): array
    {
        return [
            'id' => (string) $request->id,
            'name' => $request->name,
            'email' => $request->email,
            'ticket_number' => $request->ticket_number,
            'topic' => $request->topic,
            'message' => $request->message,
            'created_at' => $request->created_at?->toISOString(),
        ];
    }
}
