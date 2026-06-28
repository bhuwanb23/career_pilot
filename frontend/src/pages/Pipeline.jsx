import { useState } from "react";
import AppLayout from "../components/AppLayout";
import PipelineProgress from "../components/pipeline/PipelineProgress";
import DiscoverStep from "../components/pipeline/steps/DiscoverStep";
import ScoreStep from "../components/pipeline/steps/ScoreStep";
import AnalyzeStep from "../components/pipeline/steps/AnalyzeStep";
import PrepareStep from "../components/pipeline/steps/PrepareStep";
import ApplyStep from "../components/pipeline/steps/ApplyStep";
import TrackStep from "../components/pipeline/steps/TrackStep";
import InterviewPrepStep from "../components/pipeline/steps/InterviewPrepStep";
import InterviewStep from "../components/pipeline/steps/InterviewStep";
import OfferStep from "../components/pipeline/steps/OfferStep";
import DecideStep from "../components/pipeline/steps/DecideStep";
import { MOCK_PIPELINE_STEPS, MOCK_PIPELINE_DATA } from "../data/mockData";

const stepComponents = {
  discover: DiscoverStep,
  score: ScoreStep,
  analyze: AnalyzeStep,
  prepare: PrepareStep,
  apply: ApplyStep,
  track: TrackStep,
  interview_prep: InterviewPrepStep,
  interview: InterviewStep,
  offer: OfferStep,
  decide: DecideStep,
};

const stepDescriptions = {
  discover: "Browse and discover job opportunities that match your profile and career goals.",
  score: "See how well each job matches your resume and skills.",
  analyze: "Deep dive into fit analysis, strengths, and areas for improvement.",
  prepare: "Generate tailored cover letters and outreach messages.",
  apply: "Submit your applications to selected companies.",
  track: "Monitor the status of all your applications.",
  interview_prep: "Prepare for upcoming interviews with questions and STAR answers.",
  interview: "Complete your scheduled interviews.",
  offer: "Evaluate and compare job offers.",
  decide: "Make your final decision and start your new journey.",
};

export default function Pipeline({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  const [activeStep, setActiveStep] = useState("discover");
  const [completedSteps, setCompletedSteps] = useState([]);

  const activeIndex = MOCK_PIPELINE_STEPS.findIndex((s) => s.key === activeStep);
  const CurrentStepComponent = stepComponents[activeStep] || DiscoverStep;
  const currentData = MOCK_PIPELINE_DATA[activeStep];

  const handleNext = () => {
    if (activeIndex < MOCK_PIPELINE_STEPS.length - 1) {
      setCompletedSteps((prev) => [...prev, activeStep]);
      setActiveStep(MOCK_PIPELINE_STEPS[activeIndex + 1].key);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveStep(MOCK_PIPELINE_STEPS[activeIndex - 1].key);
    }
  };

  const completedCount = completedSteps.length;
  const totalCount = MOCK_PIPELINE_STEPS.length;
  const overallProgress = Math.round((completedCount / totalCount) * 100);

  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-1">
              <span>Workspace</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-gray-600">Pipeline</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pipeline</h1>
            <p className="text-sm text-gray-500 mt-0.5">End-to-end job application workflow</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-600">{overallProgress}%</p>
            <p className="text-[10px] text-gray-400">{completedCount}/{totalCount} steps complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <PipelineProgress
          steps={MOCK_PIPELINE_STEPS}
          activeStep={activeStep}
          completedSteps={completedSteps}
          onStepClick={setActiveStep}
        />

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Step Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <span className="text-sm font-bold text-brand-600">{activeIndex + 1}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {MOCK_PIPELINE_STEPS[activeIndex]?.title}
              </h2>
              <p className="text-xs text-gray-500">{stepDescriptions[activeStep]}</p>
            </div>
          </div>

          {/* Step Body */}
          <CurrentStepComponent data={currentData} />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={activeIndex === MOCK_PIPELINE_STEPS.length - 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold hover:from-brand-700 hover:to-brand-600 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next Step
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
