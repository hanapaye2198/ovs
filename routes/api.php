<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CitizenController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:20,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:20,1');

Route::post('/tickets/lookup', [TicketController::class, 'lookup'])->middleware('throttle:30,1');
Route::post('/tickets/by-plate', [TicketController::class, 'byPlate'])->middleware('throttle:30,1');
Route::post('/tickets/settle', [TicketController::class, 'settle'])->middleware('throttle:20,1');

Route::post('/support', [SupportController::class, 'store'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/citizen/payments', [CitizenController::class, 'payments']);
    Route::get('/citizen/tickets', [CitizenController::class, 'tickets']);

    Route::middleware('staff')->group(function () {
        Route::get('/staff/dashboard', [StaffController::class, 'dashboard']);
        Route::get('/staff/users', [StaffController::class, 'users']);
        Route::post('/staff/users', [StaffController::class, 'storeUser']);
        Route::post('/staff/violations', [StaffController::class, 'store']);
        Route::patch('/staff/violations/{violation}', [StaffController::class, 'update']);
        Route::delete('/staff/violations/{violation}', [StaffController::class, 'destroy']);
        Route::post('/staff/reset', [StaffController::class, 'reset']);
    });
});
