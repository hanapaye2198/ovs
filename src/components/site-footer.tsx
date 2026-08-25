import { Link } from "@tanstack/react-router";

import tagumCitySeal from "@/assets/tagum-city-seal.png";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 shadow-sm ring-1 ring-border">
              <img src={tagumCitySeal} alt="Tagum City seal" className="size-full object-contain" />
            </span>
            <span className="font-display text-lg font-semibold">Surepay Technologies Inc.</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            The Non Contact Apprehension System is an automated violation ticketing platform for
            local government units, integrated with an administrative portal and a payment gateway
            interface.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Platform</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/features" className="hover:text-foreground">
                Features
              </Link>
            </li>
            <li>
              <Link to="/channels" className="hover:text-foreground">
                Payment channels
              </Link>
            </li>
            <li>
              <Link to="/pay" className="hover:text-foreground">
                Pay a ticket
              </Link>
            </li>
            <li>
              <Link to="/portal" className="hover:text-foreground">
                Citizen portal
              </Link>
            </li>
            <li>
              <Link to="/support" className="hover:text-foreground">
                Customer support
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-foreground">
                LGU staff login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Fourth Level Fintech Hub, TBT Building, Inigo St., Davao City</li>
            <li>Tel. 225-9249</li>
            <li>admin@surepayinc.com.ph</li>
            <li>businessoperation@surepayinc.com.ph</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 py-5 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Surepay Technologies Inc. All rights reserved.
      </div>
    </footer>
  );
}
