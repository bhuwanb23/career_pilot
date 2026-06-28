import { useState } from "react";
import AppLayout from "../components/AppLayout";
import { MOCK_OFFERS } from "../data/mockData";

const statusConfig = {
  accepted: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", label: "Accepted" },
  pending: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", label: "Pending" },
  declined: { bg: "bg-red-50", text: "text-red-500", dot: "bg-red-400", label: "Declined" },
};

const gradients = [
  "from-brand-500 to-brand-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
  "from-purple-500 to-purple-700",
  "from-rose-500 to-rose-700",
  "from-cyan-500 to-cyan-700",
];

const filters = [
  { key: "all", label: "All" },
  { key: "accepted", label: "Accepted" },
  { key: "pending", label: "Pending" },
  { key: "declined", label: "Declined" },
];

function OfferCard({ offer }) {
  const gradIdx = offer.company.charCodeAt(0) % gradients.length;
  const s = statusConfig[offer.status] || statusConfig.pending;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[gradIdx]} flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
            {offer.company[0]}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{offer.company}</h3>
            <p className="text-xs text-gray-500">{offer.role}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${s.bg}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span className={`text-[10px] font-semibold ${s.text}`}>{s.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-gray-50">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">Salary</p>
          <p className="text-sm font-bold text-gray-900">{offer.salary}</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50">
          <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">Equity</p>
          <p className="text-sm font-bold text-gray-900">{offer.equity}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium mb-2">Benefits</p>
        <div className="flex flex-wrap gap-1.5">
          {offer.benefits.map((b) => (
            <span key={b} className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[10px] font-medium">
              {b}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="text-[10px] text-gray-400">
          {offer.location}
        </div>
        {offer.startDate && (
          <span className="text-[10px] text-emerald-600 font-medium">
            Starts {new Date(offer.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

function ComparisonTable({ offers }) {
  if (offers.length < 2) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Offer Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-2 px-3 text-[10px] font-semibold text-gray-500 uppercase">Company</th>
              <th className="py-2 px-3 text-[10px] font-semibold text-gray-500 uppercase">Role</th>
              <th className="py-2 px-3 text-[10px] font-semibold text-gray-500 uppercase">Salary</th>
              <th className="py-2 px-3 text-[10px] font-semibold text-gray-500 uppercase">Equity</th>
              <th className="py-2 px-3 text-[10px] font-semibold text-gray-500 uppercase">Benefits</th>
              <th className="py-2 px-3 text-[10px] font-semibold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => {
              const s = statusConfig[offer.status] || statusConfig.pending;
              return (
                <tr key={offer.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3 text-xs font-medium text-gray-900">{offer.company}</td>
                  <td className="py-3 px-3 text-xs text-gray-600">{offer.role}</td>
                  <td className="py-3 px-3 text-xs font-semibold text-gray-900">{offer.salary}</td>
                  <td className="py-3 px-3 text-xs text-gray-600">{offer.equity}</td>
                  <td className="py-3 px-3 text-[10px] text-gray-500">{offer.benefits.length} benefits</td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Approved({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [filter, setFilter] = useState("all");

  const filteredOffers = filter === "all"
    ? MOCK_OFFERS
    : MOCK_OFFERS.filter((o) => o.status === filter);

  const stats = {
    total: MOCK_OFFERS.length,
    accepted: MOCK_OFFERS.filter((o) => o.status === "accepted").length,
    pending: MOCK_OFFERS.filter((o) => o.status === "pending").length,
    declined: MOCK_OFFERS.filter((o) => o.status === "declined").length,
  };

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
            <span>Workspace</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-gray-600">Approved</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Approved</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your job offers and decisions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Offers", value: stats.total, gradient: "from-brand-500 to-brand-600" },
            { label: "Accepted", value: stats.accepted, gradient: "from-emerald-500 to-emerald-600" },
            { label: "Pending", value: stats.pending, gradient: "from-amber-500 to-amber-600" },
            { label: "Declined", value: stats.declined, gradient: "from-red-400 to-red-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
                <span className="text-white text-sm font-bold">{stat.value}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filter === f.key
                  ? "bg-brand-50 text-brand-600 border border-brand-200"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Offer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>

        {filteredOffers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">No offers match this filter</p>
          </div>
        )}

        {/* Comparison Table */}
        <ComparisonTable offers={MOCK_OFFERS} />
      </div>
    </AppLayout>
  );
}
