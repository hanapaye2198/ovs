import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  BarChart3,
  Headphones,
  History,
  LayoutDashboard,
  Lock,
  RefreshCw,
  Smartphone,
  Sparkles,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "OVS Features — Citizen Portal & LGU Dashboard | Surepay" },
      {
        name: "description",
        content:
          "Mobile-responsive ticket settlement, real-time transaction updates, a comprehensive LGU dashboard, transaction history, and end-to-end access control.",
      },
      { property: "og:title", content: "OVS Features — Citizen Portal & LGU Dashboard" },
      {
        property: "og:description",
        content: "What the Ordinance Violation System gives citizens and local government units.",
      },
    ],
  }),
  component: Features,
});

const userFeatures = [
  { icon: Smartphone, title: "Mobile responsive & accessible", text: "Works on any phone, tablet, or desktop browser." },
  { icon: RefreshCw, title: "Real-time transaction updates", text: "Ticket status changes the moment payment clears." },
  { icon: Sparkles, title: "User-friendly interface", text: "Light and easy to navigate, even for the less tech-savvy." },
  { icon: Wallet, title: "Diverse payment options", text: "Cards, e-wallets, banks, and over-the-counter partners." },
];

const lguFeatures = [
  { icon: LayoutDashboard, title: "Comprehensive dashboard", text: "Visual snapshot of all violations, key stats, and trends." },
  { icon: History, title: "Transaction history", text: "Every settlement recorded with channel and reference number." },
  { icon: Lock, title: "End-to-end access control", text: "Role-based access so only authorized staff can encode or edit." },
  { icon: Headphones, title: "Customer support", text: "Support for both enforcement staff and paying citizens." },
];

function Group({
  label,
  items,
}: {
  label: string;
  items: { icon: typeof BarChart3; title: string; text: string }[];
}) {
  return (
    <section>
      <h2 className="text-display text-2xl font-bold sm:text-3xl">{label}</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.title} className="surface-panel flex gap-4 p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <item.icon className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 lg:py-20">
      <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
        <BadgeCheck className="size-3.5" /> Features
      </span>
      <h1 className="text-display mt-5 text-4xl font-bold sm:text-5xl">
        Everything the ordinance workflow needs
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        OVS covers the full lifecycle of a citation — from encoding the violation in the field to the
        electronic receipt in the violator&apos;s inbox.
      </p>

      <div className="mt-12 space-y-14">
        <Group label="For users" items={userFeatures} />
        <Group label="For LGUs" items={lguFeatures} />
      </div>
    </div>
  );
}
