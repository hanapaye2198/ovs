import { Link } from "@tanstack/react-router";
import { Menu, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DEMO_MODE,
  DEMO_STAFF_SESSION_EVENT,
  readDemoStaffSession,
  type DemoStaffRole,
} from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/channels", label: "Payment channels" },
  { to: "/portal", label: "Citizen portal" },
  { to: "/support", label: "Support" },
  { to: "/pay", label: "Pay a ticket" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [staffSignedIn, setStaffSignedIn] = useState(false);
  const [staffRole, setStaffRole] = useState<DemoStaffRole | null>(null);

  useEffect(() => {
    const syncStaffSession = () => {
      const session = readDemoStaffSession();
      setStaffSignedIn(Boolean(session));
      setStaffRole(session?.role ?? null);
    };

    if (DEMO_MODE) {
      syncStaffSession();
      window.addEventListener("storage", syncStaffSession);
      window.addEventListener(DEMO_STAFF_SESSION_EVENT, syncStaffSession);
      return () => {
        window.removeEventListener("storage", syncStaffSession);
        window.removeEventListener(DEMO_STAFF_SESSION_EVENT, syncStaffSession);
      };
    }

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setStaffSignedIn(Boolean(data.session));
        setStaffRole(data.session ? "admin" : null);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setStaffSignedIn(Boolean(session));
      setStaffRole(session ? "admin" : null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const staffHref = staffSignedIn ? "/dashboard" : "/auth";
  const staffLabel = staffSignedIn
    ? `${staffRole === "admin" ? "Admin" : staffRole === "encoder" ? "Encoder" : "Viewer"} workspace`
    : "LGU staff login";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold tracking-tight">OVS</span>
            <span className="block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Ordinance Violation System
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to={staffHref}>{staffLabel}</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/pay">Pay now</Link>
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu className="size-4" />
        </Button>
      </div>

      <div
        className={cn("border-t border-border bg-background md:hidden", open ? "block" : "hidden")}
      >
        <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3">
          {[...nav, { to: staffHref, label: staffLabel } as const].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
