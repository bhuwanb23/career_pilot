import AppLayout from "../components/AppLayout";
import InputSection from "../components/analysis/InputSection";
import MatchScore from "../components/analysis/MatchScore";
import SkillsAnalysis from "../components/analysis/SkillsAnalysis";
import ResumeSuggestions from "../components/analysis/ResumeSuggestions";
import CareerScoreGrid from "../components/analysis/CareerScoreGrid";
import ActionButtons from "../components/analysis/ActionButtons";

export default function JobAnalysis({ leftCollapsed, rightCollapsed, onToggleLeft, onToggleRight }) {
  return (
    <AppLayout leftCollapsed={leftCollapsed} rightCollapsed={rightCollapsed} onToggleLeft={onToggleLeft} onToggleRight={onToggleRight}>
      <div className="max-w-4xl mx-auto space-y-6">
        <InputSection />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MatchScore score={87} />
          <SkillsAnalysis />
        </div>

        <ResumeSuggestions />
        <CareerScoreGrid />
        <ActionButtons />
      </div>
    </AppLayout>
  );
}
