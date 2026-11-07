import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { PRODUCT_KINDS } from "@/lib/research";
import { createProduct } from "@/app/actions/products";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  const user = await requireUser();
  const partners = all<{ id: string; name: string }>("SELECT id, name FROM partners WHERE user_id = ? ORDER BY name", user.id);
  return (
    <div style={{ maxWidth: 720 }}>
      <h1>New product</h1>
      <p className="muted">The more specific the buyer and result, the better the outline will be.</p>
      <form action={createProduct} className="card mt">
        <div className="field"><label>Working title</label><input type="text" name="title" required placeholder="e.g. The Night-Shift Meal Prep Playbook" /></div>
        <div className="grid grid-2">
          <div className="field"><label>Type</label><select name="kind">{PRODUCT_KINDS.map((k) => <option key={k}>{k}</option>)}</select></div>
          <div className="field"><label>Price (USD)</label><input type="number" name="price" min={0} step={1} defaultValue={29} /></div>
        </div>
        <div className="field"><label>Buyer</label><input type="text" name="audience" placeholder="e.g. Nurses working 12-hour rotating shifts" /></div>
        <div className="field"><label>Problem</label><input type="text" name="problem" placeholder="e.g. Eating vending-machine food on night shifts" /></div>
        <div className="field"><label>Promised result</label><input type="text" name="promise" placeholder="e.g. A week of shift-friendly meals prepped in 90 minutes" /></div>
        {partners.length > 0 && (
          <div className="field"><label>Creator partner <span className="hint">(optional, for revenue split)</span></label>
            <select name="partner_id"><option value="">None</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
        )}
        <button className="btn primary">Create product</button>
      </form>
    </div>
  );
}
