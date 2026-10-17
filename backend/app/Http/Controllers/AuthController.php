<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:120'],
            'contact_number' => ['nullable', 'string', 'max:40'],
        ]);

        $user = User::create([
            'name' => trim($data['full_name']),
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'contact_number' => $data['contact_number'] ?? null,
            'role' => null,
            'email_verified_at' => now(),
        ]);

        return response()->json($this->tokenPayload($user, 'citizen'), 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:120'],
            'password' => ['required', 'string', 'max:120'],
            'audience' => ['required', Rule::in(['staff', 'citizen'])],
        ]);

        $user = User::query()->where('email', strtolower($data['email']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        $isStaff = in_array($user->role, ['admin', 'encoder', 'viewer'], true);

        if ($data['audience'] === 'staff' && ! $isStaff) {
            return response()->json(['message' => 'This account is not an LGU staff account.'], 403);
        }

        if ($data['audience'] === 'citizen' && $isStaff) {
            return response()->json(['message' => 'Use the LGU staff login for this account.'], 403);
        }

        return response()->json($this->tokenPayload($user, $data['audience']));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->userPayload($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Signed out.']);
    }

    private function tokenPayload(User $user, string $audience): array
    {
        $token = $user->createToken($audience)->plainTextToken;

        return [
            'token' => $token,
            'user' => $this->userPayload($user),
        ];
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role,
            'contact_number' => $user->contact_number,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
