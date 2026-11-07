"use client";
import { useActionState } from "react";
import { generateOutline, type OutlineState } from "@/app/actions/products";

export function OutlineButton({ productId, hasSections }: { productId: string; hasSections: boolean }) {
  const [state, action, pending] = useActionState<OutlineState, FormData>(generateOutline, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={productId} />
      <button className={`btn${hasSections ? "" : " primary"}`} disabled={pending}>
        {pending ? "Designing outline…" : hasSections ? "Regenerate empty sections" : "Generate outline with AI"}
      </button>
      {state?.error && <div className="notice error mt">{state.error}</div>}
    </form>
  );
}
