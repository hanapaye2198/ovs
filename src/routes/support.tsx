import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_MODE } from "@/lib/demo-data";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Customer Support | OVS" },
      {
        name: "description",
        content:
          "Get help with OVS ticket lookup, payment receipts, citizen accounts, and LGU portal access.",
      },
    ],
  }),
  component: Support,
});

const supportTopics = [
  {
    title: "I cannot find my ticket",
    text: "Check that the ticket number matches the citation, including the OVS prefix and dashes.",
  },
  {
    title: "I need a payment receipt",
    text: "Keep your transaction reference ready. Our support team can help verify a completed settlement.",
  },
  {
    title: "I am an LGU staff member",
    text: "For account or role issues, contact the LGU administrator or the OVS business operations team.",
  },
];

function Support() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [topic, setTopic] = useState("Ticket lookup");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (DEMO_MODE) {
      setSubmitted(true);
      return;
    }
    const subject = encodeURIComponent(`[OVS Support] ${topic}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nTicket number: ${ticketNumber || "Not provided"}\n\n${message}`,
    );
    window.location.href = `mailto:businessoperation@surepayinc.com.ph?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 lg:py-20">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          <MessageCircle className="size-3.5" /> Customer support
        </span>
        <h1 className="text-display mt-5 text-4xl font-bold sm:text-5xl">
          We&apos;re here to help keep things moving.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Get help with a ticket, payment receipt, citizen account, or LGU portal access. Include
          your reference number so the support team can find the right record quickly.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <section className="surface-panel p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CircleHelp className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
                  Quick answers
                </p>
                <h2 className="text-xl font-semibold">Common questions</h2>
              </div>
            </div>
            <div className="mt-6 space-y-5">
              {supportTopics.map((item) => (
                <div
                  key={item.title}
                  className="border-b border-border pb-5 last:border-0 last:pb-0"
                >
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-panel p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
              Direct contact
            </p>
            <div className="mt-5 space-y-4">
              <ContactLine icon={Mail} label="Email" value="businessoperation@surepayinc.com.ph" />
              <ContactLine icon={Phone} label="Telephone" value="225-9249" />
              <ContactLine
                icon={Clock3}
                label="Office"
                value="Fourth Level Fintech Hub, Davao City"
              />
            </div>
          </section>
        </div>

        <section className="surface-panel p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <Ticket className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-text">
                Support request
              </p>
              <h2 className="text-xl font-semibold">Tell us what happened</h2>
            </div>
          </div>

          {submitted ? (
            <div className="mt-8 rounded-xl border border-success/30 bg-success/10 p-6 text-center text-success">
              <CheckCircle2 className="mx-auto size-8" />
              <h3 className="mt-3 font-semibold">Your email draft is ready</h3>
              <p className="mt-1 text-sm">
                Send the message from your email app to reach the support team.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={() => setSubmitted(false)}
              >
                Send another request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="support-name">Your name</Label>
                  <Input
                    id="support-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Email address</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-ticket">
                  Ticket or reference number{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="support-ticket"
                  value={ticketNumber}
                  onChange={(event) => setTicketNumber(event.target.value.toUpperCase())}
                  placeholder="OVS-2026-000101 or receipt reference"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-topic">What do you need help with?</Label>
                <select
                  id="support-topic"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option>Ticket lookup</option>
                  <option>Payment or receipt</option>
                  <option>Citizen portal account</option>
                  <option>LGU staff portal</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-message">Message</Label>
                <Textarea
                  id="support-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell us how we can help…"
                  className="min-h-32"
                  required
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Open email request <ArrowRight />
              </Button>
            </form>
          )}
        </section>
      </div>

      <div className="hero-gradient mt-8 flex flex-col gap-5 rounded-2xl px-6 py-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent-text" />
          <div>
            <h2 className="font-semibold">Need to settle a ticket now?</h2>
            <p className="mt-1 text-sm text-primary-foreground/75">
              You can pay online without creating an account.
            </p>
          </div>
        </div>
        <Button asChild variant="secondary">
          <Link to="/pay">
            Pay a ticket <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ContactLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
