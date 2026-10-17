<?php

namespace App\Http\Controllers;

use App\Models\SupportRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:120'],
            'ticket_number' => ['nullable', 'string', 'max:40'],
            'topic' => ['required', 'string', 'max:80'],
            'message' => ['required', 'string', 'max:4000'],
        ]);

        $supportRequest = SupportRequest::create([
            'name' => trim($data['name']),
            'email' => strtolower($data['email']),
            'ticket_number' => trim((string) ($data['ticket_number'] ?? '')) ?: null,
            'topic' => trim($data['topic']),
            'message' => trim($data['message']),
        ]);

        return response()->json([
            'id' => (string) $supportRequest->id,
            'message' => 'Support request received.',
        ], 201);
    }
}
