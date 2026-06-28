export default function OfferStep({ data }) {
  const offers = data?.offers || [];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Offers Received</h3>
      {offers.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-8">No offers received yet</p>
      ) : (
        <div className="space-y-3">
          {offers.map((offer, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{offer.company}</h4>
                  <p className="text-[10px] text-gray-500">{offer.role}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">{offer.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-[9px] text-gray-400 mb-0.5">Salary</p>
                  <p className="text-sm font-bold text-gray-900">{offer.salary}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-[9px] text-gray-400 mb-0.5">Equity</p>
                  <p className="text-sm font-bold text-gray-900">{offer.equity}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
