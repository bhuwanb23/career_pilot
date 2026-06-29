import KanbanCard from "./KanbanCard";
import { STAGE_COLORS } from "./kanbanConstants";

export default function KanbanColumn({
  title,
  stage,
  applications = [],
  onCardClick,
  onDrop,
  onDragOver,
}) {
  const colors = STAGE_COLORS[stage] || STAGE_COLORS.applied;
  const count = applications.length;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver?.(stage);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("application/id");
    if (appId) onDrop?.(Number(appId), stage);
  };

  return (
    <div className="flex flex-col w-full min-w-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
          <h3 className={`text-sm font-semibold ${colors.header}`}>{title}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${colors.count}`}>
          {count}
        </span>
      </div>

      <div
        className="flex-1 bg-gray-50/60 rounded-2xl p-2.5 space-y-2 overflow-y-auto min-h-[200px] transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {applications.length > 0 ? (
          applications.map((app) => (
            <KanbanCard key={app.id} application={app} onClick={onCardClick} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl">
            <svg className="w-6 h-6 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-[11px] text-gray-400 font-medium">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}
