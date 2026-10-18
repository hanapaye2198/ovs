<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\User;
use App\Models\Violation;
use App\Support\Records;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OvsSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedUsers();
        $this->seedRecords();
    }

    public function seedUsers(): void
    {
        $accounts = [
            ['name' => 'Demo Administrator', 'email' => 'admin@ovs.demo', 'role' => 'admin'],
            ['name' => 'Demo Encoder', 'email' => 'encoder@ovs.demo', 'role' => 'encoder'],
            ['name' => 'Demo Viewer', 'email' => 'viewer@ovs.demo', 'role' => 'viewer'],
            ['name' => 'Demo Citizen', 'email' => 'citizen@ovs.demo', 'role' => null],
        ];

        foreach ($accounts as $account) {
            User::query()->updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => 'demo1234',
                    'role' => $account['role'],
                    'email_verified_at' => now(),
                ],
            );
        }
    }

    public function seedRecords(): void
    {
        DB::transaction(function () {
            Payment::query()->delete();
            Violation::query()->delete();

            $adminId = User::query()->where('email', 'admin@ovs.demo')->value('id');
            $citizen = 'citizen@ovs.demo';

            $rows = [
                ['OVS-2026-000101', 'Juan Dela Cruz', 'Bajada, Davao City', 'N01-23-456789', 'LAB 2841', 'MV-2841', 'Disregarding Traffic Signs', 'Ord. 1557-11 Sec. 12', 1000, 'Quirino Ave. cor. Bonifacio St.', '2026-08-22T09:15:00.000Z', 'PO2 R. Mendoza', null, 'unpaid', $citizen],
                ['OVS-2026-000102', 'Maria Santos', 'Matina, Davao City', 'N02-11-998877', 'ABC 1122', 'MV-1122', 'No Helmet (Driver)', 'Ord. 0300-07 Sec. 5', 500, 'McArthur Hwy, Matina Crossing', '2026-08-20T14:30:00.000Z', 'PO1 J. Lim', null, 'paid', $citizen],
                ['OVS-2026-000103', 'Pedro Reyes', 'Toril, Davao City', 'N03-45-112233', 'XYZ 7788', 'MV-7788', 'Illegal Parking', 'Ord. 1557-11 Sec. 22', 1500, 'Toril Public Market', '2026-08-24T08:05:00.000Z', 'PO3 A. Cruz', null, 'unpaid', null],
                ['OVS-2026-000104', 'Ana Lorenzo', 'Buhangin, Davao City', 'N04-77-334455', 'DEF 9021', 'MV-9021', 'Anti-Smoking Ordinance', 'Ord. 0367-12 Sec. 4', 500, 'Buhangin Terminal', '2026-08-16T11:40:00.000Z', 'Enf. M. Villar', null, 'paid', null],
                ['OVS-2026-000105', 'Carlo Bautista', 'Agdao, Davao City', 'N05-19-556677', 'GHI 3345', 'MV-3345', 'Obstruction of Sidewalk', 'Ord. 1557-11 Sec. 31', 2000, 'Agdao Public Market', '2026-08-25T07:50:00.000Z', 'Enf. D. Sanchez', 'Vendor cart occupying the pedestrian lane.', 'unpaid', null],
                ['OVS-2026-000106', 'Liza Ramos', 'Talomo, Davao City', 'N06-33-778899', 'JKL 5567', 'MV-5567', 'Overloading', 'Ord. 1557-11 Sec. 18', 1000, 'Ulas Junction', '2026-08-19T16:20:00.000Z', 'PO2 R. Mendoza', 'Case under review by the hearing officer.', 'contested', null],
                ['OVS-2026-000107', 'Miguel Torres', 'Mintal, Davao City', 'N07-88-223344', 'MNO 7789', 'MV-7789', 'Anti-Littering', 'Ord. 0361-12 Sec. 3', 300, 'Mintal Diversion Rd.', '2026-08-18T10:05:00.000Z', 'Enf. K. Uy', null, 'unpaid', null],
                ['OVS-2026-000108', 'Grace Alcantara', 'Lanang, Davao City', 'N08-55-667788', 'PQR 1123', 'MV-1123', 'Beating the Red Light', 'Ord. 1557-11 Sec. 9', 1000, 'JP Laurel Ave., Lanang', '2026-08-23T13:10:00.000Z', 'PO1 J. Lim', null, 'paid', null],
                ['OVS-2026-000109', 'Roberto Villanueva', 'Sasa, Davao City', 'N09-62-445566', 'STU 6612', 'MV-6612', 'No Parking in Loading Zone', 'Ord. 1557-11 Sec. 25', 1200, 'Sasa Wharf Road', '2026-08-21T09:40:00.000Z', 'Enf. M. Villar', null, 'paid', $citizen],
                ['OVS-2026-000110', 'Sofia Mercado', 'Calinan, Davao City', 'N10-72-889900', 'VWX 4477', 'MV-4477', 'Noise Disturbance', 'Ord. 0367-12 Sec. 8', 800, 'Calinan Town Center', '2026-08-15T20:25:00.000Z', 'PO3 A. Cruz', 'Cancelled after duplicate citation review.', 'cancelled', null],
            ];

            $byTicket = [];
            foreach ($rows as $row) {
                $violation = Violation::create([
                    'ticket_number' => $row[0],
                    'violator_name' => $row[1],
                    'address' => $row[2],
                    'license_number' => $row[3],
                    'vehicle_plate' => Records::normalizePlate($row[4]),
                    'mv_file_number' => Records::normalizeFile($row[5]),
                    'violation_type' => $row[6],
                    'ordinance_code' => $row[7],
                    'fine_amount' => $row[8],
                    'location' => $row[9],
                    'issued_at' => $row[10],
                    'officer' => $row[11],
                    'remarks' => $row[12],
                    'status' => $row[13],
                    'citizen_email' => $row[14],
                    'created_by' => $adminId,
                    'created_at' => $row[10],
                    'updated_at' => $row[10],
                ]);
                $byTicket[$row[0]] = $violation;
            }

            $payments = [
                ['OVS-2026-000102', 500, 'GCash', 'REF-2026-000102', 'citizen@ovs.demo', '2026-08-20T14:45:00.000Z'],
                ['OVS-2026-000104', 500, 'Maya', 'REF-2026-000104', 'payer@example.com', '2026-08-16T12:05:00.000Z'],
                ['OVS-2026-000108', 1000, 'Maya', 'REF-2026-000108', 'payer@example.com', '2026-08-23T13:25:00.000Z'],
                ['OVS-2026-000109', 1200, 'GCash', 'REF-2026-000109', 'citizen@ovs.demo', '2026-08-21T10:05:00.000Z'],
            ];

            foreach ($payments as $payment) {
                Payment::create([
                    'violation_id' => $byTicket[$payment[0]]->id,
                    'amount' => $payment[1],
                    'channel' => $payment[2],
                    'reference' => $payment[3],
                    'payer_email' => $payment[4],
                    'status' => 'completed',
                    'paid_at' => $payment[5],
                    'created_at' => $payment[5],
                    'updated_at' => $payment[5],
                ]);
            }
        });
    }
}
