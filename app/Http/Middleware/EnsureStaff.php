<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = $request->user()?->role;

        if (! in_array($role, ['admin', 'encoder', 'viewer'], true)) {
            return response()->json(['message' => 'Staff access is required.'], 403);
        }

        return $next($request);
    }
}
