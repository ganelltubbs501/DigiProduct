import { notFound } from "next/navigation";
import { get } from "@/lib/db";
import { orderByToken } from "@/lib/payments";
import { productSections, type Product } from "@/lib/products";
import { renderMarkdown } from "@/lib/markdown";

export const metadata = { title: "Your purchase", robots: { index: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> };

export default async function DownloadPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { new: isNew } = await searchParams;
  const order = await orderByToken(token);
  if (!order) notFound();
  const product = await get<Product>("SELECT * FROM products WHERE id = ?", order.product_id);
  if (!product) notFound();

  if (order.status !== "paid") {
    return (
      <div className="card" style={{ maxWidth: 560, margin: "40px auto" }}>
        <h1>Payment processing</h1>
        <p className="muted">We haven&apos;t received confirmation of your payment yet. Refresh this page in a minute.</p>
      </div>
    );
  }

  const sections = await productSections(product.id);
  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      {isNew && <div className="notice info">Thank you for your purchase. Bookmark this page: it&apos;s your permanent access link.</div>}
      {order.test_mode === 1 && <div className="notice">Test-mode order: no payment was taken.</div>}
      <div className="spread">
        <h1 style={{ margin: 0 }}>{product.title}</h1>
        <a className="btn" href={`/api/download/${token}`}>Download (.md)</a>
      </div>
      <p className="muted">{product.tagline}</p>
      <div className="card mt">
        <h2>Contents</h2>
        <ol style={{ margin: 0 }}>
          {sections.map((s) => (
            <li key={s.id}><a href={`#s-${s.position}`}>{s.title}</a></li>
          ))}
        </ol>
      </div>
      {sections.map((s) => (
        <section key={s.id} id={`s-${s.position}`} className="card prose mt">
          {s.content.trim() ? (
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(s.content) }} />
          ) : (
            <>
              <h2>{s.title}</h2>
              <p className="muted">This section is coming soon.</p>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
