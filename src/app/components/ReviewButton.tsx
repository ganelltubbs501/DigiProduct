"use client";
import { useActionState } from "react";
import { runReview, type ReviewState } from "@/app/actions/review";

export function ReviewButton({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(runReview, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="product_id" value={productId} />
      <button className="btn primary" disabled={pending}>{pending ? "Reviewing…" : "Run launch review"}</button>
      {state?.error && <div className="notice error mt">{state.error}</div>}
    </form>
  );
}
