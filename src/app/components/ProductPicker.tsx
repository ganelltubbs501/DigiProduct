"use client";
import { useRouter } from "next/navigation";

export function ProductPicker({ products, selected, basePath }: { products: { id: string; title: string }[]; selected: string; basePath: string }) {
  const router = useRouter();
  return (
    <div style={{ minWidth: 240 }}>
      <label htmlFor="product-picker">Product</label>
      <select id="product-picker" value={selected} onChange={(e) => router.push(`${basePath}?product=${e.target.value}`)}>
        {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
      </select>
    </div>
  );
}
