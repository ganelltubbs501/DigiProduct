import { NextResponse } from "next/server";
import { confirmCheckout } from "@/lib/payments";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) return NextResponse.redirect(new URL("/", url));
  const order = await confirmCheckout(sessionId);
  if (!order) return NextResponse.redirect(new URL("/", url));
  return NextResponse.redirect(new URL(`/download/${order.download_token}?new=1`, url));
}
