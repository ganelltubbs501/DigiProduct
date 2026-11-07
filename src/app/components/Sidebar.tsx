"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV: { label: string; items: [string, string][] }[] = [
  { label: "Home", items: [["/dashboard", "Dashboard"], ["/academy", "Academy"]] },
  { label: "Research", items: [["/research", "Demand Lab"], ["/partners", "Partner CRM"]] },
  { label: "Build & launch", items: [["/products", "Products"], ["/studio", "Launch Studio"]] },
  { label: "Distribute & grow", items: [["/distribution", "Audience Finder"], ["/sales", "Sales"], ["/review", "Launch Review"], ["/leaderboard", "90-Day Challenge"]] },
  { label: "Help", items: [["/coach", "Coach"]] },
];

export function Sidebar({ name, aiOn, logout }: { name: string; aiOn: boolean; logout: () => Promise<void> }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mobile-bar">
        <span className="brand" style={{ padding: 0 }}><span className="brand-mark" /> DigiProduct</span>
        <button className="btn small" onClick={() => setOpen(true)} aria-label="Open menu">Menu</button>
      </div>
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="spread">
          <Link href="/dashboard" className="brand"><span className="brand-mark" /> DigiProduct</Link>
          {open && <button className="btn small" onClick={() => setOpen(false)}>Close</button>}
        </div>
        <nav className="nav" onClick={() => setOpen(false)}>
          {NAV.map((g) => (
            <div key={g.label} className="nav-group">
              <div className="nav-label">{g.label}</div>
              {g.items.map(([href, label]) => (
                <Link key={href} href={href} className={path === href || path.startsWith(href + "/") ? "active" : ""}>
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div style={{ color: "var(--text)", fontWeight: 600 }}>{name}</div>
          <div className="row" style={{ marginTop: 6 }}>
            <span className={`badge ${aiOn ? "good" : "warn"}`}>{aiOn ? "AI connected" : "Demo mode"}</span>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <Link href="/settings">Settings</Link>
            <form action={logout}><button className="btn small" type="submit">Log out</button></form>
          </div>
        </div>
      </aside>
    </>
  );
}
