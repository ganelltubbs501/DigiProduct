import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { get } from "@/lib/db";
import { money, productSections, type Product } from "@/lib/products";
import { paymentsLive } from "@/lib/payments";
import { renderMarkdown } from "@/lib/markdown";
import { buy } from "@/app/actions/store";
import { Cover } from "@/app/components/Cover";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; cancelled?: string }> };

function load(slug: string) {
  return get<Product & { partner_name: string | null }>(
    `SELECT p.*, pa.name AS partner_name FROM products p LEFT JOIN partners pa ON pa.id = p.partner_id
     WHERE p.slug = ? AND p.status = 'published'`,
    slug,
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = load((await params).slug);
  return p ? { title: p.title, description: p.tagline } : {};
}

export default async function StorePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const product = load(slug);
  if (!product) notFound();
  const sections = productSections(product.id);

  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0, 300px) minmax(0, 1fr)", gap: 36 }}>
      <div>
        <Cover title={product.title} tagline={product.tagline} hue={product.cover_hue} kind={product.kind} />
      </div>
      <div>
        <h1 style={{ fontSize: "2rem" }}>{product.title}</h1>
        {product.partner_name && <p className="muted">With {product.partner_name}</p>}
        <p style={{ fontSize: "1.1rem" }}>{product.tagline}</p>

        <div className="card mt">
          <div className="spread">
            <div className="stat-value">{money(product.price_cents)}</div>
            {!paymentsLive() && <span className="badge warn">Test mode: no real payment</span>}
          </div>
          {sp.error === "email" && <div className="notice error mt">Enter a valid email address.</div>}
          {sp.cancelled && <div className="notice info mt">Checkout cancelled. You can try again any time.</div>}
          <form action={buy} className="row mt">
            <input type="hidden" name="slug" value={product.slug} />
            <input type="email" name="email" required placeholder="you@example.com" style={{ flex: 1, minWidth: 200 }} aria-label="Email" />
            <button className="btn primary">Buy now</button>
          </form>
          <p className="small muted" style={{ margin: "8px 0 0" }}>Instant access. Your download link is also tied to this email.</p>
        </div>

        {product.description && <div className="prose mt-lg" dangerouslySetInnerHTML={{ __html: renderMarkdown(product.description) }} />}

        {sections.length > 0 && (
          <div className="card mt-lg">
            <h2>What&apos;s inside</h2>
            <ol style={{ paddingLeft: "1.3em", margin: 0 }}>
              {sections.map((s) => (
                <li key={s.id} style={{ marginBottom: 6 }}>
                  <strong>{s.title}</strong>
                  {s.brief && <div className="small muted">{s.brief}</div>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <style>{`@media (max-width: 720px) { .grid[style] { grid-template-columns: 1fr !important; gap: 20px !important; } .grid[style] > div:first-child { max-width: 180px; } }`}</style>
    </div>
  );
}
