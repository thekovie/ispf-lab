"use client";
/**
 * Application shell for /lab: providers + top bar + terminal + coach panel + Explain drawer.
 * Gated to keyboard-capable, wide viewports (see DesktopGate).
 */
import { SimulatorProvider } from "@/state/SimulatorProvider";
import { TutorialProvider, useTutorial } from "@/state/TutorialProvider";
import { Terminal } from "@/components/terminal/Terminal";
import { LearningPanel } from "@/components/coach/LearningPanel";
import { ExplainDrawer } from "@/components/coach/ExplainDrawer";
import { DesktopGate } from "./DesktopGate";
import { TopBar } from "./TopBar";
import "./shell.css";

export function LabShell() {
  return (
    <DesktopGate>
      <SimulatorProvider>
        <TutorialProvider>
          <LabLayout />
        </TutorialProvider>
      </SimulatorProvider>
    </DesktopGate>
  );
}

function LabLayout() {
  const t = useTutorial();
  const showCoach = t.mode !== "sandbox";
  return (
    <div className="lab">
      <TopBar />
      <main className={`lab__main${showCoach ? " lab__main--coach" : ""}`}>
        <div className="lab__terminal">
          <Terminal highlightField={t.highlightField} />
        </div>
        {showCoach && <LearningPanel />}
      </main>
      <ExplainDrawer />
      <footer className="lab__footer mono">Educational ISPF training simulator. Not affiliated with or endorsed by IBM.</footer>
    </div>
  );
}
