import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CreditCard,
  FileSearch,
  Receipt,
  Smartphone,
  Wallet,
} from "lucide-react";

import heroImage from "@/assets/ovs-hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Non Contact Apprehension System for LGUs | Surepay" },
      {
        name: "description",
        content:
          "Automated ordinance violation ticketing for local government units. Violators settle tickets online anytime, anywhere, through 40+ payment channels.",
      },
      { property: "og:title", content: "Non Contact Apprehension System for LGUs" },
      {
        property: "og:description",
        content:
          "Automated non-contact apprehension with an LGU admin portal and an integrated payment gateway by Surepay Technologies Inc.",
      },
    ],
  }),
  component: Home,
});

const steps = [
  { icon: Building2, title: "NCAS Website", text: "The violator visits the official NCAS portal." },
  {
    icon: FileSearch,
    title: "Violation Details",
    text: "They enter the ticket number and tap Pay Now.",
  },
  {
    icon: CreditCard,
    title: "Pay Online",
    text: "They are routed to the payment gateway to settle.",
  },
  {
    icon: Receipt,
    title: "Receipt Issued",
    text: "An electronic receipt confirms the payment instantly.",
  },
];

const pitch = [
  {
    tag: "For the LGU",
    title: "Modern governance, measurable collection",
    body: "Real-time tracking gives accurate, up-to-date status on every ticket and payment, so fine collection is facilitated faster and operating income rises.",
  },
  {
    tag: "For citizens",
    title: "Convenience without the queue",
    body: "An end-to-end online settlement portal removes long queues and travel hours, with a light interface anyone can navigate and diverse payment options.",
  },
  {
    tag: "For law and order",
    title: "Compliance made simple",
    body: "Simplified compliance paves the way for a more orderly, safer community where accountability is promoted and easier to uphold.",
  },
];

function Home() {
  return (
    <div>
      <section className="hero-gradient relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="text-primary-foreground">
            <h1 className="text-display mt-6 text-4xl font-bold sm:text-5xl lg:text-6xl">
              Ordinance violations, ticketed and settled online.
            </h1>
            <p className="mt-5 max-w-xl text-base/7 text-primary-foreground/80">
              The Non Contact Apprehension System is an automated violation ticketing system for
              local government units. Paired with an administrative portal and a payment gateway
              interface, violators can settle their tickets anytime, anywhere, straight from their
              phone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/pay">
                  Pay a ticket <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/auth">LGU portal</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-primary-foreground/15 pt-6">
              {[
                ["40+", "Payment channels"],
                ["24/7", "Online settlement"],
                ["Real-time", "Transaction updates"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl font-semibold text-accent">{value}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wide text-primary-foreground/65">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <img
              src={heroImage}
              alt="Traffic enforcer issuing a digital ordinance violation citation beside a mobile payment receipt"
              width={1280}
              height={960}
              className="w-full rounded-2xl border border-primary-foreground/15 shadow-[var(--shadow-lift)]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 lg:py-20">
        <h2 className="text-display text-3xl font-bold sm:text-4xl">
          Built for both sides of the counter
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A citizen portal that anyone can use, and an administrative dashboard that keeps
          enforcement teams organized.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Smartphone,
              title: "Citizen portal",
              text: "Mobile-responsive lookup, review, and settlement with an electronic receipt at the end.",
            },
            {
              icon: BarChart3,
              title: "LGU dashboard",
              text: "Live stats on issued tickets, collections, and outstanding fines with full transaction history.",
            },
            {
              icon: Wallet,
              title: "Payment gateway",
              text: "Cards, e-wallets, banks, and over-the-counter partners across the country.",
            },
          ].map((item) => (
            <article key={item.title} className="surface-panel p-6">
              <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 lg:py-20">
          <h2 className="text-display text-3xl font-bold sm:text-4xl">
            Payment through the website
          </h2>
          <p className="mt-3 text-muted-foreground">
            Four steps from citation to electronic receipt.
          </p>
          <ol className="mt-10 grid gap-5 md:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="surface-panel relative p-6">
                <span className="font-mono text-xs font-semibold text-accent-text">
                  STEP {String(i + 1).padStart(2, "0")}
                </span>
                <step.icon className="mt-3 size-6 text-primary" />
                <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 lg:py-20">
        <h2 className="text-display text-3xl font-bold sm:text-4xl">
          Why LGUs adopt the Non Contact Apprehension System
        </h2>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pitch.map((item) => (
            <article key={item.tag} className="surface-panel flex flex-col p-7">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-text">
                {item.tag}
              </span>
              <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm/6 text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="hero-gradient flex flex-col items-start gap-6 rounded-2xl px-8 py-12 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-display text-2xl font-bold sm:text-3xl">
              Have a ticket to settle?
            </h2>
            <p className="mt-2 text-primary-foreground/75">
              Enter your ticket number and pay in under a minute.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link to="/pay">
              Start payment <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
