import { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { listApplications } from "../services/api";

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
    <div className="bg-white rounded-2xl border border-figma-hairline p-5 hover-lift transition-all-smooth">
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

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <span className="text-[10px] text-gray-400">{offer.location}</span>
        {offer.startDate && (
          <span className="text-[10px] text-emerald-600 font-medium">
            Starts {new Date(offer.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Approved({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [filter, setFilter] = useState("all");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listApplications({ status: "offer" })
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredOffers = filter === "all"
    ? offers
    : offers.filter((o) => o.status === filter);

  const stats = {
    total: offers.length,
    accepted: offers.filter((o) => o.status === "accepted").length,
    pending: offers.filter((o) => o.status === "pending").length,
    declined: offers.filter((o) => o.status === "declined").length,
  };

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Approved</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your job offers and decisions</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Offers", value: stats.total },
            { label: "Accepted", value: stats.accepted },
            { label: "Pending", value: stats.pending },
            { label: "Declined", value: stats.declined },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-figma-hairline p-5">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-2xl font-light text-black">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                filter === f.key
                  ? "bg-black text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-gray-400">Loading...</div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-500 mb-1">No offers yet</p>
            <p className="text-sm text-gray-400">Offers will appear here when received</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
