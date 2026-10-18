<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\SupportRequest;
use App\Models\User;
use App\Models\Violation;
use App\Support\Records;
use Database\Seeders\OvsSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $violations = Violation::query()->orderByDesc('issued_at')->get();
        $payments = Payment::query()->orderByDesc('paid_at')->get();
        $supportRequests = SupportRequest::query()->latest()->limit(20)->get();

        return response()->json([
            'violations' => $violations->map(fn (Violation $violation) => Records::violation($violation))->values(),
            'payments' => $payments->map(fn (Payment $payment) => Records::payment($payment))->values(),
            'support_requests' => $supportRequests->map(fn (SupportRequest $request) => Records::supportRequest($request))->values(),
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Administrator access is required.'], 403);
        }

        $users = User::query()
            ->whereIn('role', ['admin', 'encoder', 'viewer'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'users' => $users->map(fn (User $user) => $this->staffUser($user))->values(),
        ]);
    }

    public function storeUser(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Administrator access is required.'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:120'],
            'role' => ['required', Rule::in(['admin', 'encoder', 'viewer'])],
        ]);

        $user = User::create([
            'name' => trim($data['name']),
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'role' => $data['role'],
            'email_verified_at' => now(),
        ]);

        return response()->json(['user' => $this->staffUser($user)], 201);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->user()->role === 'viewer') {
            return response()->json(['message' => 'Your role can view records only.'], 403);
        }

        $data = $this->validated($request, true);
        $plate = Records::normalizePlate($data['vehicle_plate'] ?? null);

        $violation = Violation::create([
            'ticket_number' => strtoupper(trim($data['ticket_number'])),
            'violator_name' => trim($data['violator_name']),
            'violation_type' => trim($data['violation_type']),
            'ordinance_code' => $this->blankToNull($data['ordinance_code'] ?? null),
            'fine_amount' => $data['fine_amount'],
            'location' => $this->blankToNull($data['location'] ?? null),
            'vehicle_plate' => $plate !== '' ? $plate : null,
            'mv_file_number' => $this->blankToNull($data['mv_file_number'] ?? null),
            'address' => $this->blankToNull($data['address'] ?? null),
            'license_number' => $this->blankToNull($data['license_number'] ?? null),
            'citizen_email' => $this->blankToNull($data['citizen_email'] ?? null),
            'officer' => $this->blankToNull($data['officer'] ?? null),
            'remarks' => $this->blankToNull($data['remarks'] ?? null),
            'status' => $data['status'] ?? 'unpaid',
            'issued_at' => now(),
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['violation' => Records::violation($violation)], 201);
    }

    public function update(Request $request, Violation $violation): JsonResponse
    {
        if ($request->user()->role === 'viewer') {
            return response()->json(['message' => 'Your role can view records only.'], 403);
        }

        $data = $this->validated($request, false, $violation->id);
        $plate = Records::normalizePlate($data['vehicle_plate'] ?? null);

        $violation->update([
            'ticket_number' => strtoupper(trim($data['ticket_number'])),
            'violator_name' => trim($data['violator_name']),
            'violation_type' => trim($data['violation_type']),
            'ordinance_code' => $this->blankToNull($data['ordinance_code'] ?? null),
            'fine_amount' => $data['fine_amount'],
            'location' => $this->blankToNull($data['location'] ?? null),
            'vehicle_plate' => $plate !== '' ? $plate : null,
            'mv_file_number' => $this->blankToNull($data['mv_file_number'] ?? null),
            'address' => $this->blankToNull($data['address'] ?? null),
            'license_number' => $this->blankToNull($data['license_number'] ?? null),
            'citizen_email' => $this->blankToNull($data['citizen_email'] ?? null),
            'officer' => $this->blankToNull($data['officer'] ?? null),
            'remarks' => $this->blankToNull($data['remarks'] ?? null),
            'status' => $data['status'],
        ]);

        return response()->json(['violation' => Records::violation($violation->fresh())]);
    }

    public function destroy(Request $request, Violation $violation): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Administrator access is required.'], 403);
        }

        $ticketNumber = $violation->ticket_number;
        $violation->delete();

        return response()->json(['message' => "{$ticketNumber} deleted."]);
    }

    public function reset(Request $request): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Administrator access is required.'], 403);
        }

        app(OvsSeeder::class)->seedRecords();

        return response()->json(['message' => 'Records reset to the original seed data.']);
    }

    private function validated(Request $request, bool $creating, ?int $ignoreId = null): array
    {
        $request->merge([
            'ticket_number' => strtoupper(trim((string) $request->input('ticket_number', ''))),
            'vehicle_plate' => Records::normalizePlate($request->input('vehicle_plate')),
            'mv_file_number' => Records::normalizeFile($request->input('mv_file_number')),
            'citizen_email' => strtolower(trim((string) $request->input('citizen_email', ''))) ?: null,
        ]);

        return $request->validate([
            'ticket_number' => [
                'required',
                'string',
                'min:4',
                'max:40',
                Rule::unique('violations', 'ticket_number')->ignore($ignoreId),
            ],
            'violator_name' => ['required', 'string', 'max:160'],
            'violation_type' => ['required', 'string', 'max:160'],
            'ordinance_code' => ['nullable', 'string', 'max:160'],
            'fine_amount' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'location' => ['nullable', 'string', 'max:200'],
            'vehicle_plate' => ['nullable', 'string', 'max:20'],
            'mv_file_number' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string', 'max:200'],
            'license_number' => ['nullable', 'string', 'max:40'],
            'citizen_email' => ['nullable', 'email', 'max:120'],
            'officer' => ['nullable', 'string', 'max:120'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'status' => [$creating ? 'nullable' : 'required', Rule::in(['unpaid', 'paid', 'contested', 'cancelled'])],
        ]);
    }

    private function staffUser(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }

    private function blankToNull(?string $value): ?string
    {
        $trimmed = trim((string) $value);

        return $trimmed === '' ? null : $trimmed;
    }
}
