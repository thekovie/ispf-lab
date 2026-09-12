"use client";
/**
 * The coach panel beside the terminal. Learn: instruction + why + hint + progress.
 * Practice: objective + hints on request. Challenge: task + counters + final verdict.
 * Reference: docs/05-course-design.md §Coaching UI.
 */
import { useTutorial } from "@/state/TutorialProvider";
import { LESSONS } from "@/tutorial/lessons";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="coach__section">
      <h3 className="coach__label">{label}</h3>
      <div className="coach__body">{children}</div>
    </section>
  );
}

export function LearningPanel() {
  const t = useTutorial();
  const { lesson, runner, step, mode } = t;

  if (!lesson || !runner) {
    return (
      <aside className="coach" aria-label="Learning panel">
        <div className="coach__title">NO LESSON SELECTED</div>
        <p className="coach__body">Pick a lesson from the menu above, or switch to Sandbox to use the simulator freely.</p>
        <ol className="coach__lessons">
          {LESSONS.map((l) => (
            <li key={l.id}>
              <button type="button" className="coach__lesson-link" onClick={() => t.startLesson(l.id)}>
                <span className="coach__lesson-num">{String(l.number).padStart(2, "0")}</span> {l.title}
                {t.progress.lessons[l.id]?.status === "completed" && <span className="coach__done"> done</span>}
              </button>
            </li>
          ))}
        </ol>
      </aside>
    );
  }

  const total = lesson.steps.length;
  const done = runner.completedSteps.length;
  const completed = runner.status === "completed";
  const modeLabel = mode.toUpperCase();

  return (
    <aside className="coach" aria-label="Learning panel" aria-live="polite">
      <div className="coach__title">
        LESSON {lesson.number} <span className="coach__mode">{modeLabel}</span>
      </div>
      <h2 className="coach__heading">{lesson.title}</h2>
      <div className="coach__module">{lesson.module}</div>

      <Section label="Objective">{t.text(mode === "challenge" && lesson.challenge ? lesson.challenge.task : lesson.objective)}</Section>

      {completed ? (
        <Section label="Result">
          <p className="coach__ok">Lesson complete.</p>
          {mode === "challenge" && (
            <p>
              Score {t.score} / 100 — {runner.mistakes} mistake{runner.mistakes === 1 ? "" : "s"}, {runner.hintsUsed} hint{runner.hintsUsed === 1 ? "" : "s"}.
            </p>
          )}
          <div className="coach__actions">
            <button type="button" className="crt-button crt-button--primary" onClick={t.nextLesson}>
              Next lesson
            </button>
            <button type="button" className="crt-button" onClick={t.restartLesson}>
              Restart
            </button>
          </div>
        </Section>
      ) : (
        <>
          {mode === "learn" && step && (
            <>
              <Section label="Current task">{t.text(step.instruction)}</Section>
              {step.explanation && <Section label="Why?">{t.text(step.explanation)}</Section>}
            </>
          )}
          {mode === "practice" && <Section label="How it works">Work it out yourself. Reveal a hint if you get stuck; each hint is recorded.</Section>}
          {mode === "challenge" && (
            <Section label="Rules">
              Only the final result is checked. Mistakes (terminal error messages) and hints reduce the score: {runner.mistakes} mistake{runner.mistakes === 1 ? "" : "s"}, {runner.hintsUsed} hint
              {runner.hintsUsed === 1 ? "" : "s"} so far.
            </Section>
          )}
          {step && (
            <Section label="Hint">
              {runner.hintShown ? <p>{t.text(step.hint)}</p> : (
                <button type="button" className="crt-button" onClick={t.showHint}>
                  Show hint
                </button>
              )}
            </Section>
          )}
          {runner.detour && mode === "learn" && <Section label="Note">{runner.detour}</Section>}
        </>
      )}

      {mode !== "challenge" && (
        <Section label="Progress">
          <div className="coach__progress">
            <span className="coach__progress-text">
              {done} / {total}
            </span>
            <div className="coach__bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
              <div className="coach__bar-fill" style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
            </div>
          </div>
          <ol className="coach__steps">
            {lesson.steps.map((s, i) => (
              <li key={s.id} className={i < runner.stepIndex ? "is-done" : i === runner.stepIndex && !completed ? "is-current" : ""}>
                {i < runner.stepIndex ? "✓" : i === runner.stepIndex && !completed ? "›" : "·"} {s.id.replace(/-/g, " ")}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {!completed && (
        <div className="coach__actions">
          <button type="button" className="crt-button crt-button--ghost" onClick={t.restartLesson}>
            Restart lesson
          </button>
        </div>
      )}
      <div className="coach__teaches">
        <span className="coach__label">Teaches</span> {lesson.teaches.join(" · ")}
      </div>
    </aside>
  );
}
