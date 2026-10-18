<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('contact_number')->nullable()->after('email');
            $table->string('role', 20)->nullable()->after('password');
        });

        Schema::create('violations', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique();
            $table->string('violator_name');
            $table->string('address')->nullable();
            $table->string('license_number')->nullable();
            $table->string('vehicle_plate')->nullable()->index();
            $table->string('mv_file_number')->nullable()->index();
            $table->string('citizen_email')->nullable()->index();
            $table->string('violation_type');
            $table->string('ordinance_code')->nullable();
            $table->decimal('fine_amount', 10, 2)->default(0);
            $table->string('location')->nullable();
            $table->timestamp('issued_at');
            $table->string('officer')->nullable();
            $table->text('remarks')->nullable();
            $table->string('status', 20)->default('unpaid')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('violation_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('channel');
            $table->string('reference')->unique();
            $table->string('payer_email')->nullable()->index();
            $table->string('status')->default('completed');
            $table->timestamp('paid_at');
            $table->timestamps();
        });

        Schema::create('support_requests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('ticket_number')->nullable();
            $table->string('topic');
            $table->text('message');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_requests');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('violations');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['contact_number', 'role']);
        });
    }
};
