"use client";
/**
 * 3270-style operator information area (the line under the screen).
 */
interface StatusLineProps {
  row: number;
  col: number;
  insertMode: boolean;
  mode: string;
  dirty: boolean;
  userid: string;
  loggedIn: boolean;
}

export function StatusLine({ row, col, insertMode, mode, dirty, userid, loggedIn }: StatusLineProps) {
  return (
    <div className="status-line" aria-live="polite">
      <span className="status-line__item status-line__item--sys">4B</span>
      <span className="status-line__item">{loggedIn ? userid : "LOGON"}</span>
      <span className="status-line__item">{mode}</span>
      {dirty && <span className="status-line__item status-line__item--warn">MODIFIED</span>}
      <span className="status-line__spacer" />
      {insertMode && <span className="status-line__item status-line__item--warn">^ INSERT</span>}
      <span className="status-line__item">
        {String(row).padStart(2, "0")}/{String(col).padStart(3, "0")}
      </span>
    </div>
  );
}
