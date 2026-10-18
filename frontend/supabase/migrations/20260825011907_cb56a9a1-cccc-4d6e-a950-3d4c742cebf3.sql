CREATE TYPE public.app_role AS ENUM ('admin','encoder','viewer');
CREATE TYPE public.violation_status AS ENUM ('unpaid','paid','contested','cancelled');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  contact_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  violator_name TEXT NOT NULL,
  address TEXT,
  license_number TEXT,
  vehicle_plate TEXT,
  violation_type TEXT NOT NULL,
  ordinance_code TEXT,
  fine_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  location TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  officer TEXT,
  remarks TEXT,
  status public.violation_status NOT NULL DEFAULT 'unpaid',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.violations TO authenticated;
GRANT ALL ON public.violations TO service_role;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read violations" ON public.violations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert violations" ON public.violations FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update violations" ON public.violations FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin delete violations" ON public.violations FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_id UUID NOT NULL REFERENCES public.violations(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  channel TEXT NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  payer_email TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read payments" ON public.payments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER violations_updated_at BEFORE UPDATE ON public.violations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.violations (ticket_number, violator_name, address, license_number, vehicle_plate, violation_type, ordinance_code, fine_amount, location, issued_at, officer, status) VALUES
('OVS-2026-000101','Juan Dela Cruz','Bajada, Davao City','N01-23-456789','LAB 2841','Disregarding Traffic Signs','Ord. 1557-11 Sec. 12',1000.00,'Quirino Ave. cor. Bonifacio St.', now() - interval '3 days','PO2 R. Mendoza','unpaid'),
('OVS-2026-000102','Maria Santos','Matina, Davao City','N02-11-998877','ABC 1122','No Helmet (Driver)','Ord. 0300-07 Sec. 5',500.00,'McArthur Hwy, Matina Crossing', now() - interval '5 days','PO1 J. Lim','paid'),
('OVS-2026-000103','Pedro Reyes','Toril, Davao City','N03-45-112233','XYZ 7788','Illegal Parking','Ord. 1557-11 Sec. 22',1500.00,'Toril Public Market', now() - interval '1 day','PO3 A. Cruz','unpaid'),
('OVS-2026-000104','Ana Lorenzo','Buhangin, Davao City','N04-77-334455','DEF 9021','Anti-Smoking Ordinance','Ord. 0367-12 Sec. 4',500.00,'Buhangin Terminal', now() - interval '9 days','Enf. M. Villar','paid'),
('OVS-2026-000105','Carlo Bautista','Agdao, Davao City','N05-19-556677','GHI 3345','Obstruction of Sidewalk','Ord. 1557-11 Sec. 31',2000.00,'Agdao Public Market', now() - interval '12 days','Enf. D. Sanchez','unpaid'),
('OVS-2026-000106','Liza Ramos','Talomo, Davao City','N06-33-778899','JKL 5567','Overloading','Ord. 1557-11 Sec. 18',1000.00,'Ulas Junction', now() - interval '15 days','PO2 R. Mendoza','contested'),
('OVS-2026-000107','Miguel Torres','Mintal, Davao City','N07-88-223344','MNO 7789','Anti-Littering','Ord. 0361-12 Sec. 3',300.00,'Mintal Diversion Rd.', now() - interval '20 days','Enf. K. Uy','unpaid'),
('OVS-2026-000108','Grace Alcantara','Lanang, Davao City','N08-55-667788','PQR 1123','Beating the Red Light','Ord. 1557-11 Sec. 9',1000.00,'JP Laurel Ave., Lanang', now() - interval '2 days','PO1 J. Lim','unpaid');

INSERT INTO public.payments (violation_id, amount, channel, reference, payer_email, status)
SELECT id, fine_amount, 'GCash', 'REF-' || replace(ticket_number,'OVS-',''), 'payer@example.com', 'completed'
FROM public.violations WHERE status = 'paid';