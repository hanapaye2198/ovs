import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEMO_MODE,
  DEMO_STAFF_ACCOUNTS,
  findDemoStaffAccount,
  readDemoStaffSession,
  saveDemoStaffSession,
} from "@/lib/demo-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "LGU Staff Login | NCAS" },
      {
        name: "description",
        content:
          "Secure access for authorized local government staff managing ordinance violations.",
      },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) {
      if (readDemoStaffSession()) {
        void navigate({ to: "/dashboard", replace: true });
      }
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  function switchMode(nextMode: "sign-in" | "sign-up") {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      if (DEMO_MODE) {
        if (mode === "sign-in") {
          const account = findDemoStaffAccount(email, password);
          if (!account) {
            setError("Invalid staff email or password.");
            return;
          }
          saveDemoStaffSession(account);
          await navigate({ to: "/dashboard" });
        } else {
          setMessage(
            "Demo staff access is already configured. Use Sign in to open the demo dashboard.",
          );
          setMode("sign-in");
        }
        return;
      }
      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        await navigate({ to: "/dashboard" });
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          await navigate({ to: "/dashboard" });
        } else {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
          setMode("sign-in");
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to complete that request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:py-20">
      <section>
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          <ShieldCheck className="size-3.5" /> Authorized access
        </span>
        <h1 className="text-display mt-5 max-w-xl text-4xl font-bold sm:text-5xl">
          Keep every violation moving.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground">
          Sign in to the LGU portal to review live ticket activity, add new violators, and keep your
          records organized from one secure workspace.
        </p>
        <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
          {[
            ["Live view", "Real-time ticket status"],
            ["Searchable", "Find cases in seconds"],
            ["Controlled", "Role-based access"],
          ].map(([title, text]) => (
            <div key={title} className="surface-panel p-4">
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Looking to settle a ticket?{" "}
          <Link to="/pay" className="font-semibold text-primary hover:underline">
            Pay as a citizen
          </Link>
          .
        </p>
      </section>

      <section className="surface-panel mx-auto w-full max-w-md p-6 sm:p-8">
        <div className="flex rounded-lg bg-secondary p-1">
          {(["sign-in", "sign-up"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchMode(item)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {item === "sign-in" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        {DEMO_MODE ? (
          <div className="mt-5 rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-accent-foreground">
            <p className="font-semibold">Choose a demo staff role</p>
            <p className="mt-1 text-xs">All demo accounts use password demo1234.</p>
            <div className="mt-3 grid gap-2">
              {DEMO_STAFF_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  className="rounded-md border border-accent/20 bg-background/70 px-3 py-2 text-left transition-colors hover:bg-background"
                  onClick={() => {
                    setMode("sign-in");
                    setEmail(account.email);
                    setPassword(account.password);
                    setError("");
                    setMessage("");
                  }}
                >
                  <span className="block text-xs font-semibold capitalize text-foreground">
                    {account.role} · {account.email}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {account.summary}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-7">
          <h2 className="text-2xl font-semibold">
            {mode === "sign-in" ? "Welcome back" : "Create staff account"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "sign-in"
              ? "Use your authorized LGU credentials."
              : "Your administrator can assign your portal role."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "sign-up" ? (
            <div className="space-y-2">
              <Label htmlFor="full-name">Full name</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="full-name"
                  className="pl-9"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Juan Dela Cruz"
                  required
                />
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email address</Label>
            <Input
              id="staff-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="staff@yourlgu.gov.ph"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-password">Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="staff-password"
                type={showPassword ? "text" : "password"}
                className="pl-9 pr-10"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {message ? (
            <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{message}</p>
          ) : null}
          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "sign-in" ? "Open LGU portal" : "Create account"}{" "}
            <ArrowRight />
          </Button>
        </form>
      </section>
    </div>
  );
}
