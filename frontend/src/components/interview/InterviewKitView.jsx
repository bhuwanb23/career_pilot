import { useState, useEffect, useMemo } from "react";
import CompanySummary from "./CompanySummary";
import QuestionAccordion from "./QuestionAccordion";
import StarAnswerCard from "./StarAnswerCard";
import PrepChecklist from "./PrepChecklist";
import NotesEditor from "./NotesEditor";
import AISuggestions from "./AISuggestions";
import { buildChecklistFromPrep, normalizePrepForView } from "./interviewUtils";

function PrepNotesPanel({ prepNotes }) {
  if (!prepNotes || Object.keys(prepNotes).length === 0) return null;

  const sections = [
    { key: "topics_to_revise", label: "Topics to Revise" },
    { key: "important_skills", label: "Important Skills" },
    { key: "resume_highlights", label: "Resume Highlights" },
    { key: "questions_to_ask", label: "Questions to Ask" },
  ];

  const hasContent = sections.some((s) => (prepNotes[s.key] || []).length > 0);
  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Prep Notes</h3>
      </div>
      <div className="space-y-4">
        {sections.map(({ key, label }) => {
          const items = prepNotes[key] || [];
          if (!items.length) return null;
          return (
            <div key={key}>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
              <ul className="space-y-1">
                {items.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-brand-400 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InterviewKitView({
  prep,
  loading = false,
  compact = false,
  hubLink,
  checkedIds: externalCheckedIds,
  onToggleCheck: externalOnToggleCheck,
  onGenerate,
  onRegenerate,
  onSaveNotes,
}) {
  const normalized = useMemo(() => normalizePrepForView(prep), [prep]);
  const [internalCheckedIds, setInternalCheckedIds] = useState(new Set());

  const checkedIds = externalCheckedIds ?? internalCheckedIds;
  const handleToggleCheck =
    externalOnToggleCheck ??
    ((id) => {
      setInternalCheckedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    });

  useEffect(() => {
    if (externalCheckedIds === undefined) {
      setInternalCheckedIds(new Set());
    }
  }, [prep?.id, externalCheckedIds]);

  const checklist = useMemo(
    () => buildChecklistFromPrep(normalized?.prep_notes, checkedIds),
    [normalized?.prep_notes, checkedIds]
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Generating interview kit...</p>
      </div>
    );
  }

  if (!normalized) {
    return (
      <div className="text-center py-10">
        <p className="text-sm font-medium text-gray-500 mb-1">No interview prep yet</p>
        <p className="text-xs text-gray-400 mb-4">Generate questions, STAR answers, and company intel for this role</p>
        {onGenerate && (
          <button
            onClick={onGenerate}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-xs font-semibold hover:from-brand-700 hover:to-brand-600 transition-all shadow-sm"
          >
            Generate Interview Kit
          </button>
        )}
      </div>
    );
  }

  const actionBar = (
    <div className="flex items-center gap-2 flex-wrap">
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Regenerate
        </button>
      )}
      {hubLink && (
        <a
          href={hubLink}
          className="px-3 py-1.5 rounded-lg bg-brand-50 text-xs font-semibold text-brand-600 hover:bg-brand-100 transition-colors"
        >
          Open in Interview Hub
        </a>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">{actionBar}</div>
        <CompanySummary summary={normalized.company_summary} companyIntel={normalized.company_intel} />
        <QuestionAccordion questions={normalized.questions} groupByCategory />
        <AISuggestions suggestions={normalized.ai_suggestions} />
        {normalized.star_answers?.length > 0 && (
          <div className="space-y-3">
            {normalized.star_answers.map((answer, i) => (
              <StarAnswerCard key={i} answer={answer} index={i} />
            ))}
          </div>
        )}
        {onSaveNotes && <NotesEditor initialNotes={normalized.notes || ""} onSave={onSaveNotes} />}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="flex justify-end lg:hidden">{actionBar}</div>
        <CompanySummary summary={normalized.company_summary} companyIntel={normalized.company_intel} />
        <PrepChecklist checklist={checklist} onToggle={handleToggleCheck} />
        <PrepNotesPanel prepNotes={normalized.prep_notes} />
        <AISuggestions suggestions={normalized.ai_suggestions} />
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="hidden lg:flex justify-end">{actionBar}</div>
        <QuestionAccordion questions={normalized.questions} groupByCategory />

        {normalized.star_answers?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">STAR Method Answers</h3>
              <span className="ml-auto text-[10px] text-gray-400">{normalized.star_answers.length} answers</span>
            </div>
            <div className="space-y-3">
              {normalized.star_answers.map((answer, i) => (
                <StarAnswerCard key={i} answer={answer} index={i} />
              ))}
            </div>
          </div>
        )}

        {onSaveNotes && <NotesEditor initialNotes={normalized.notes || ""} onSave={onSaveNotes} />}
      </div>
    </div>
  );
}
