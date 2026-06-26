import AppLayout from "../components/AppLayout";
import InputSection from "../components/analysis/InputSection";
import MatchScore from "../components/analysis/MatchScore";
import SkillsAnalysis from "../components/analysis/SkillsAnalysis";
import ResumeSuggestions from "../components/analysis/ResumeSuggestions";
import CareerScoreGrid from "../components/analysis/CareerScoreGrid";
import ActionButtons from "../components/analysis/ActionButtons";

export default function JobAnalysis() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <InputSection />

        {/* Row 1: Match Score + Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MatchScore score={87} />
          <SkillsAnalysis />
        </div>

        {/* Resume Suggestions */}
        <ResumeSuggestions />

        {/* CareerPilot Score Grid */}
        <CareerScoreGrid />

        {/* Action Buttons */}
        <ActionButtons />
      </div>
    </AppLayout>
  );
}
