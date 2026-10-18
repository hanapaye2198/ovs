<?php

namespace Tests\Feature;

use App\Models\SupportRequest;
use App\Models\Violation;
use Database\Seeders\OvsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OvsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(OvsSeeder::class);
    }

    public function test_ticket_lookup_masks_the_violator_name(): void
    {
        $response = $this->postJson('/api/tickets/lookup', [
            'ticket_number' => 'ovs-2026-000101',
        ]);

        $response->assertOk()
            ->assertJsonPath('ticket.ticket_number', 'OVS-2026-000101')
            ->assertJsonPath('ticket.violator_name', 'J**n D**a C**z')
            ->assertJsonPath('ticket.status', 'unpaid')
            ->assertJsonPath('ticket.fine_amount', 1000);
    }

    public function test_unknown_ticket_returns_null(): void
    {
        $this->postJson('/api/tickets/lookup', [
            'ticket_number' => 'OVS-0000-000000',
        ])->assertOk()->assertJsonPath('ticket', null);
    }

    public function test_plate_lookup_returns_matching_violations(): void
    {
        $this->postJson('/api/tickets/by-plate', [
            'vehicle_plate' => 'abc 1122',
            'mv_file_number' => 'mv-1122',
        ])->assertOk()
            ->assertJsonCount(1, 'tickets')
            ->assertJsonPath('tickets.0.vehicle_plate', 'ABC 1122');
    }

    public function test_plate_lookup_rejects_a_mismatched_mv_file(): void
    {
        $this->postJson('/api/tickets/by-plate', [
            'vehicle_plate' => 'ABC 1122',
            'mv_file_number' => 'MV-0000',
        ])->assertOk()->assertJsonCount(0, 'tickets');
    }

    public function test_settlement_marks_an_unpaid_ticket_paid(): void
    {
        $response = $this->postJson('/api/tickets/settle', [
            'ticket_number' => 'OVS-2026-000103',
            'channel' => 'GCash',
            'email' => 'payer@example.com',
        ]);

        $response->assertOk()
            ->assertJsonPath('ticketNumber', 'OVS-2026-000103')
            ->assertJsonPath('amount', 1500)
            ->assertJsonPath('channel', 'GCash');

        $this->assertNotEmpty($response->json('reference'));
        $this->assertDatabaseHas('violations', [
            'ticket_number' => 'OVS-2026-000103',
            'status' => 'paid',
            'citizen_email' => 'payer@example.com',
        ]);

        $this->postJson('/api/tickets/settle', [
            'ticket_number' => 'OVS-2026-000103',
            'channel' => 'GCash',
            'email' => 'payer@example.com',
        ])->assertStatus(422);
    }

    public function test_staff_can_sign_in_and_load_the_dashboard(): void
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => 'admin@ovs.demo',
            'password' => 'demo1234',
            'audience' => 'staff',
        ])->assertOk();

        $token = $login->json('token');

        $this->withToken($token)
            ->getJson('/api/staff/dashboard')
            ->assertOk()
            ->assertJsonCount(10, 'violations')
            ->assertJsonCount(4, 'payments');
    }

    public function test_citizen_cannot_open_the_staff_dashboard(): void
    {
        $this->postJson('/api/auth/login', [
            'email' => 'citizen@ovs.demo',
            'password' => 'demo1234',
            'audience' => 'staff',
        ])->assertStatus(403);

        $citizen = $this->postJson('/api/auth/login', [
            'email' => 'citizen@ovs.demo',
            'password' => 'demo1234',
            'audience' => 'citizen',
        ])->assertOk();

        $this->withToken($citizen->json('token'))
            ->getJson('/api/staff/dashboard')
            ->assertStatus(403);

        $this->withToken($citizen->json('token'))
            ->getJson('/api/citizen/payments')
            ->assertOk()
            ->assertJsonCount(2, 'payments');

        $this->withToken($citizen->json('token'))
            ->getJson('/api/citizen/tickets')
            ->assertOk()
            ->assertJsonCount(3, 'tickets');
    }

    public function test_viewer_cannot_create_or_delete_records(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'viewer@ovs.demo',
            'password' => 'demo1234',
            'audience' => 'staff',
        ])->json('token');

        $this->withToken($token)->postJson('/api/staff/violations', [
            'ticket_number' => 'OVS-2026-009999',
            'violator_name' => 'New Person',
            'violation_type' => 'Illegal Parking',
            'fine_amount' => 500,
        ])->assertStatus(403);

        $violation = Violation::query()->where('ticket_number', 'OVS-2026-000101')->firstOrFail();

        $this->withToken($token)
            ->deleteJson('/api/staff/violations/'.$violation->id)
            ->assertStatus(403);
    }

    public function test_encoder_can_add_a_violation_and_admin_can_delete_it(): void
    {
        $encoder = $this->postJson('/api/auth/login', [
            'email' => 'encoder@ovs.demo',
            'password' => 'demo1234',
            'audience' => 'staff',
        ])->json('token');

        $created = $this->withToken($encoder)->postJson('/api/staff/violations', [
            'ticket_number' => 'ovs-2026-009999',
            'violator_name' => 'New Person',
            'violation_type' => 'Illegal Parking',
            'fine_amount' => 750,
            'vehicle_plate' => 'new 1001',
            'status' => 'unpaid',
        ])->assertCreated();

        $created->assertJsonPath('violation.ticket_number', 'OVS-2026-009999');
        $created->assertJsonPath('violation.vehicle_plate', 'NEW 1001');

        $admin = $this->postJson('/api/auth/login', [
            'email' => 'admin@ovs.demo',
            'password' => 'demo1234',
            'audience' => 'staff',
        ])->json('token');

        $this->app['auth']->forgetGuards();

        $this->withToken($admin)
            ->deleteJson('/api/staff/violations/'.$created->json('violation.id'))
            ->assertOk();

        $this->assertDatabaseMissing('violations', ['ticket_number' => 'OVS-2026-009999']);
    }

    public function test_support_request_is_stored(): void
    {
        $this->postJson('/api/support', [
            'name' => 'Juan Dela Cruz',
            'email' => 'juan@example.com',
            'ticket_number' => 'OVS-2026-000101',
            'topic' => 'Ticket lookup',
            'message' => 'I cannot find my receipt.',
        ])->assertCreated();

        $this->assertSame(1, SupportRequest::query()->count());

        $admin = $this->postJson('/api/auth/login', [
            'email' => 'admin@ovs.demo',
            'password' => 'demo1234',
            'audience' => 'staff',
        ])->json('token');

        $this->withToken($admin)
            ->getJson('/api/staff/dashboard')
            ->assertOk()
            ->assertJsonPath('support_requests.0.email', 'juan@example.com');
    }

    public function test_admin_can_create_a_staff_account(): void
    {
        $admin = $this->postJson('/api/auth/login', [
            'email' => 'admin@ovs.demo',
            'password' => 'demo1234',
            'audience' => 'staff',
        ])->json('token');

        $this->withToken($admin)->postJson('/api/staff/users', [
            'name' => 'New Encoder',
            'email' => 'new.encoder@ovs.demo',
            'password' => 'demo1234',
            'role' => 'encoder',
        ])->assertCreated()
            ->assertJsonPath('user.email', 'new.encoder@ovs.demo')
            ->assertJsonPath('user.role', 'encoder');

        $viewer = $this->postJson('/api/auth/login', [
            'email' => 'viewer@ovs.demo',
            'password' => 'demo1234',
            'audience' => 'staff',
        ])->json('token');

        $this->app['auth']->forgetGuards();

        $this->withToken($viewer)->getJson('/api/staff/users')->assertStatus(403);
    }
}
