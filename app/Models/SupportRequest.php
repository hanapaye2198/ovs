<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportRequest extends Model
{
    protected $fillable = [
        'name',
        'email',
        'ticket_number',
        'topic',
        'message',
    ];
}
