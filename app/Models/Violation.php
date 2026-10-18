<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Violation extends Model
{
    protected $fillable = [
        'ticket_number',
        'violator_name',
        'address',
        'license_number',
        'vehicle_plate',
        'mv_file_number',
        'citizen_email',
        'violation_type',
        'ordinance_code',
        'fine_amount',
        'location',
        'issued_at',
        'officer',
        'remarks',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'fine_amount' => 'decimal:2',
            'issued_at' => 'datetime',
        ];
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
