export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public" style={{ paddingTop: 28, paddingBottom: 60 }}>
      {children}
      <p className="small muted mt-lg" style={{ textAlign: "center" }}>Powered by DigiProduct</p>
    </div>
  );
}
