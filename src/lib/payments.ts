import "server-only";
import Stripe from "stripe";
import { randomBytes } from "node:crypto";
import { get, run, id, now } from "./db";
import type { Product } from "./products";

/**
 * Checkout and delivery. With STRIPE_SECRET_KEY set, buyers pay through a
 * Stripe Checkout session. Without it the store runs in test mode: the order
 * is marked paid immediately so the whole buy -> deliver flow can be tried.
 */

let stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

export function paymentsLive(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function baseUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export type Order = {
  id: string;
  product_id: string;
  buyer_email: string;
  amount_cents: number;
  status: "pending" | "paid" | "refunded";
  download_token: string;
  stripe_session_id: string | null;
  test_mode: number;
  created_at: string;
};

/** Returns the URL to send the buyer to next. */
export async function startCheckout(product: Product, buyerEmail: string): Promise<string> {
  const orderId = id();
  const token = randomBytes(24).toString("base64url");
  const s = getStripe();

  if (!s) {
    run(
      "INSERT INTO orders (id, product_id, buyer_email, amount_cents, status, download_token, test_mode, created_at) VALUES (?, ?, ?, ?, 'paid', ?, 1, ?)",
      orderId,
      product.id,
      buyerEmail,
      product.price_cents,
      token,
      now(),
    );
    return `/download/${token}?new=1`;
  }

  run(
    "INSERT INTO orders (id, product_id, buyer_email, amount_cents, status, download_token, test_mode, created_at) VALUES (?, ?, ?, ?, 'pending', ?, 0, ?)",
    orderId,
    product.id,
    buyerEmail,
    product.price_cents,
    token,
    now(),
  );
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: buyerEmail,
    client_reference_id: orderId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: product.price_cents,
          product_data: { name: product.title, description: product.tagline || undefined },
        },
      },
    ],
    success_url: `${baseUrl()}/api/checkout/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl()}/p/${product.slug}?cancelled=1`,
  });
  run("UPDATE orders SET stripe_session_id = ? WHERE id = ?", session.id, orderId);
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/** Called on return from Stripe. Marks the order paid if Stripe says so. */
export async function confirmCheckout(sessionId: string): Promise<Order | null> {
  const s = getStripe();
  if (!s) return null;
  const session = await s.checkout.sessions.retrieve(sessionId);
  const order = get<Order>("SELECT * FROM orders WHERE stripe_session_id = ?", session.id);
  if (!order) return null;
  if (session.payment_status === "paid" && order.status !== "paid") {
    run("UPDATE orders SET status = 'paid' WHERE id = ?", order.id);
    order.status = "paid";
  }
  return order;
}

/** Stripe webhook: the reliable path for marking orders paid. */
export async function handleWebhook(rawBody: string, signature: string | null): Promise<void> {
  const s = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret || !signature) throw new Error("Webhook not configured");
  const event = s.webhooks.constructEvent(rawBody, signature, secret);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") run("UPDATE orders SET status = 'paid' WHERE stripe_session_id = ?", session.id);
  }
}

export function orderByToken(token: string): Order | undefined {
  return get<Order>("SELECT * FROM orders WHERE download_token = ?", token);
}
