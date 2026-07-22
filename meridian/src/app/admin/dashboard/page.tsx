export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-medium">Admin dashboard</h1>
      <p className="mt-2 text-sm text-white/70">
        Your authenticated admin account is wired up. The listing approval
        queue and platform analytics (FR-9/FR-16) build on this shell in
        the next implementation pass.
      </p>
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Coming next: approval queue, investor/broker/developer management,
        and the analytics dashboard.
      </div>
    </div>
  );
}
