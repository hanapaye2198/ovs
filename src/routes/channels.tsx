import { createFileRoute } from "@tanstack/react-router";
import { Banknote, CreditCard, Landmark, Store } from "lucide-react";

export const Route = createFileRoute("/channels")({
  head: () => ({
    meta: [
      { title: "Payment Channels — Cards, E-Wallets, Banks & OTC | OVS" },
      {
        name: "description",
        content:
          "Settle ordinance violation tickets through credit cards, e-wallets like GCash and Maya, major Philippine banks, and over-the-counter partners nationwide.",
      },
      { property: "og:title", content: "OVS Payment Channels" },
      {
        property: "og:description",
        content: "Cards, e-wallets, banks, and over-the-counter partners for ordinance violation payments.",
      },
    ],
  }),
  component: Channels,
});

export const CHANNEL_GROUPS = [
  {
    icon: CreditCard,
    label: "Credit cards",
    items: ["Mastercard", "VISA", "UnionPay"],
  },
  {
    icon: Banknote,
    label: "E-wallets",
    items: ["GCash", "Maya", "GrabPay", "Alipay", "WeChat Pay", "coins.ph", "Dragonpay", "digipay", "Hello Money"],
  },
  {
    icon: Landmark,
    label: "Banks",
    items: [
      "UnionBank",
      "BDO",
      "BPI",
      "PNB",
      "Metrobank",
      "Security Bank",
      "Landbank",
      "China Bank",
      "EastWest",
      "RobinsonsBank",
      "UCPB",
      "AllBank",
    ],
  },
  {
    icon: Store,
    label: "Over the counter",
    items: [
      "SM Payment Counters",
      "7-Eleven",
      "Bayad Center",
      "Cebuana Lhuillier",
      "Palawan Pawnshop",
      "M Lhuillier",
      "LBC",
      "eCPay",
      "Ministop",
      "WalterMart",
      "Robinsons Malls",
      "The Landmark",
      "PHLPost",
      "Western Union",
      "Villarica",
      "Tambunting",
      "2GO Express",
      "TouchPay",
    ],
  },
] as const;

function Channels() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 lg:py-20">
      <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
        Payment channels
      </span>
      <h1 className="text-display mt-5 text-4xl font-bold sm:text-5xl">You can now pay through any channel</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Violators pick whatever method they already use — no bank account required, no trip to the city hall
        cashier.
      </p>

      <div className="mt-12 space-y-6">
        {CHANNEL_GROUPS.map((group) => (
          <section key={group.label} className="surface-panel p-7">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <group.icon className="size-5" />
              </span>
              <h2 className="text-xl font-semibold">{group.label}</h2>
              <span className="ml-auto font-mono text-xs text-muted-foreground">{group.items.length}</span>
            </div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-border bg-secondary/60 px-3 py-1.5 text-sm font-medium"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
