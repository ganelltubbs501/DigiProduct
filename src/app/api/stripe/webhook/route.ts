import { handleWebhook } from "@/lib/payments";

export async function POST(req: Request) {
  try {
    await handleWebhook(await req.text(), req.headers.get("stripe-signature"));
    return new Response("ok");
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "error", { status: 400 });
  }
}
