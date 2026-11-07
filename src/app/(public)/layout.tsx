import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public">
      <nav className="public-nav">
        <Link href="/" className="brand" style={{ padding: 0 }}>
          <span className="brand-mark" /> DigiProduct
        </Link>
        <div className="row">
          <Link href="/login" className="btn">Log in</Link>
          <Link href="/signup" className="btn primary">Get started</Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
