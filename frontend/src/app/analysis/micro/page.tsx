import { Suspense } from "react";
import MicroAnalysis from "@/views/analysis/MicroAnalysis";

export default function Page() {
  return (
    <Suspense fallback={<MicroAnalysisLoading />}>
      <MicroAnalysis />
    </Suspense>
  );
}

function MicroAnalysisLoading() {
  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] px-6 py-24 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] animate-spin" />
    </div>
  );
}
