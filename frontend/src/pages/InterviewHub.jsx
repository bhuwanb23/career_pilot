import { useState } from "react";
import AppLayout from "../components/AppLayout";
import CompanyHeader from "../components/interview/CompanyHeader";
import CompanySummary from "../components/interview/CompanySummary";
import QuestionAccordion from "../components/interview/QuestionAccordion";
import StarAnswerCard from "../components/interview/StarAnswerCard";
import PrepChecklist from "../components/interview/PrepChecklist";
import NotesEditor from "../components/interview/NotesEditor";
import { MOCK_APPLICATIONS, MOCK_INTERVIEW_PREP, MOCK_CHECKLIST } from "../data/mockData";

export default function InterviewHub({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [selectedAppId, setSelectedAppId] = useState(MOCK_APPLICATIONS[0]?.id || null);
  const [checklist, setChecklist] = useState(MOCK_CHECKLIST);
  const [notes, setNotes] = useState("");

  const selectedApp = MOCK_APPLICATIONS.find((a) => a.id === selectedAppId);
  const interviewPrep = MOCK_INTERVIEW_PREP;

  const handleToggleCheck = (id) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#c5b0f4] rounded-3xl p-10">
          <h1 className="text-4xl font-light text-black tracking-tight mb-2">Interview Hub</h1>
          <p className="text-lg text-black/70 font-light">Prepare for your upcoming interviews</p>
          <div className="mt-6">
            <select
              value={selectedAppId || ""}
              onChange={(e) => setSelectedAppId(Number(e.target.value))}
              className="px-4 py-2.5 rounded-full bg-white border border-[#e6e6e6] text-sm text-black outline-none"
            >
              {MOCK_APPLICATIONS.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.company} — {app.role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Company Header */}
        <CompanyHeader application={selectedApp} checklist={checklist} />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Summary + Checklist */}
          <div className="lg:col-span-1 space-y-6">
            <CompanySummary summary={interviewPrep.company_summary} />
            <PrepChecklist checklist={checklist} onToggle={handleToggleCheck} />
          </div>

          {/* Right Column: Questions + STAR + Notes */}
          <div className="lg:col-span-2 space-y-6">
            <QuestionAccordion questions={interviewPrep.questions} />

            {/* STAR Answers */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">STAR Method Answers</h3>
                <span className="ml-auto text-[10px] text-gray-400">{interviewPrep.star_answers?.length || 0} answers</span>
              </div>
              <div className="space-y-3">
                {interviewPrep.star_answers?.map((answer, i) => (
                  <StarAnswerCard key={i} answer={answer} index={i} />
                ))}
              </div>
            </div>

            <NotesEditor initialNotes={notes} onSave={setNotes} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
