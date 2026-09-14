/**
 * ISPF screen engine model: state, actions, events, rendered screens.
 * Reference: docs/02-architecture.md §Engine, docs/03-ispf-behaviour-reference.md.
 */
import type { Catalog, DsnRef } from "@/catalog/types";
import type { EditorMode, EditorSession } from "@/editor/types";
import type { Settings } from "@/persistence/settingsStore";
import type { EditProfiles } from "@/editor/profile";

export type ListMode = "E" | "B" | "V" | "M";

export type ScreenFrame =
  | { id: "LOGIN" }
  | { id: "PRIMARY_OPTION_MENU" }
  | { id: "SETTINGS" }
  | { id: "UTILITY_SELECTION" }
  | { id: "EDIT_ENTRY"; mode: "EDIT" | "VIEW" }
  | { id: "LIBRARY_UTILITY" }
  | { id: "DATASET_UTILITY" }
  | { id: "ALLOCATE_DATASET"; dsn: string }
  | { id: "MOVE_COPY" }
  | { id: "DSLIST_SEARCH" }
  | { id: "DSLIST_RESULTS"; level: string; top: number }
  | { id: "DATASET_INFO"; dsn: string }
  | { id: "MEMBER_LIST"; dsn: string; mode: ListMode; top: number }
  | { id: "EDIT" }
  | { id: "BROWSE" }
  | { id: "VIEW" }
  | { id: "AUTOSAVE_PROMPT" }
  | { id: "CONFIRM_DELETE"; target: DsnRef }
  | { id: "RENAME"; target: DsnRef }
  | { id: "COPY_MOVE"; from: DsnRef; move: boolean }
  | { id: "TSO_COMMAND"; output: string[] }
  | { id: "HELP"; topic: ScreenId }
  | { id: "MESSAGE"; title: string; lines: string[] };

export type ScreenId = ScreenFrame["id"];

export interface Message {
  short: string;
  long?: string;
  severity: "info" | "error";
}

/** The per-logical-screen part of the state (ISPF split-screen mode). */
export interface ScreenSession {
  screen: ScreenFrame;
  stack: ScreenFrame[];
  editor?: EditorSession;
  activeDataset?: string;
  activeMember?: string;
  message?: Message;
  fieldValues: Record<string, string>;
  focusField?: string;
}

export interface SimulatorState {
  userid: string;
  /** all logical screens (snapshots); the entry at activeScreen may be stale — the live fields below win */
  screens: ScreenSession[];
  activeScreen: number;
  /** per-data-set-type edit profiles (PROFILE command), persisted per userid */
  editProfiles: EditProfiles;
  /** ISPF command retrieval stack (RETRIEVE / F12), newest first; shared by all logical screens */
  retrieveStack: string[];
  /** position in retrieveStack for consecutive RETRIEVEs */
  retrieveIndex: number;
  loggedIn: boolean;
  today: string;
  settings: Settings;
  screen: ScreenFrame;
  stack: ScreenFrame[];
  catalog: Catalog;
  activeDataset?: string;
  activeMember?: string;
  editor?: EditorSession;
  commandHistory: string[];
  message?: Message;
  /** draft field values kept across redisplays (e.g. after an error) */
  fieldValues: Record<string, string>;
  /** field id that should receive the cursor on next render */
  focusField?: string;
}

export type Fields = Record<string, string>;

export type SimAction =
  | { type: "ENTER"; fields: Fields }
  | { type: "PF"; key: number; fields: Fields }
  | { type: "SET_CLOCK"; today: string }
  | { type: "LOAD_CATALOG"; catalog: Catalog }
  | { type: "LOAD_SETTINGS"; settings: Settings }
  | { type: "LOAD_PROFILES"; profiles: EditProfiles }
  | { type: "RESET_ENVIRONMENT" }
  | { type: "GOTO"; screen: ScreenFrame; clearStack?: boolean }
  | { type: "LOGOFF" }
  | { type: "CLEAR_MESSAGE" };

export type SimEvent =
  | { type: "LOGGED_ON"; userid: string }
  | { type: "LOGGED_OFF" }
  | { type: "SCREEN_OPENED"; screen: ScreenId; frame: ScreenFrame }
  | { type: "OPTION_SELECTED"; option: string; from: ScreenId }
  | { type: "COMMAND_ENTERED"; screen: ScreenId; command: string }
  | { type: "PF_KEY_PRESSED"; key: number; screen: ScreenId }
  | { type: "DATASET_SEARCHED"; level: string; results: number }
  | { type: "DATASET_OPENED"; dsn: string; mode: ListMode }
  | { type: "DATASET_INFO_VIEWED"; dsn: string }
  | { type: "DATASET_ALLOCATED"; dsn: string; datasetType: "PDS" | "PS" }
  | { type: "DATASET_DELETED"; dsn: string }
  | { type: "DATASET_RENAMED"; from: string; to: string }
  | { type: "MEMBER_OPENED"; dsn: string; member?: string; mode: EditorMode }
  | { type: "MEMBER_CREATED"; dsn: string; member: string }
  | { type: "MEMBER_RENAMED"; dsn: string; from: string; to: string }
  | { type: "MEMBER_DELETED"; dsn: string; member: string }
  | { type: "MEMBER_COPIED"; from: DsnRef; to: DsnRef }
  | { type: "MEMBER_MOVED"; from: DsnRef; to: DsnRef }
  | { type: "MEMBER_SAVED"; dsn: string; member?: string }
  | { type: "EDIT_CANCELLED"; dsn: string; member?: string }
  | { type: "EDITOR_LINE_INSERTED"; count: number }
  | { type: "EDITOR_LINE_DELETED"; count: number }
  | { type: "EDITOR_LINE_REPEATED"; count: number }
  | { type: "EDITOR_LINES_COPIED"; count: number; dest: string }
  | { type: "EDITOR_LINES_MOVED"; count: number; dest: string }
  | { type: "EDITOR_LINES_EXCLUDED"; count: number }
  | { type: "EDITOR_TEXT_CHANGED"; count: number }
  | { type: "EDITOR_FIND"; text: string }
  | { type: "EDITOR_CHANGE"; detail: string }
  | { type: "EDITOR_SCROLLED" }
  | { type: "TSO_COMMAND_ENTERED"; command: string }
  | { type: "SETTING_CHANGED"; setting: string; value: string }
  | { type: "ENVIRONMENT_RESET" }
  | { type: "SCREEN_SPLIT"; screens: number; active: number }
  | { type: "SCREEN_SWAPPED"; from: number; to: number; screens: number }
  | { type: "SCREEN_CLOSED"; screens: number; active: number }
  | { type: "JUMP_EXECUTED"; path: string; from: ScreenId }
  | { type: "UNDO_EXECUTED" }
  | { type: "PROFILE_CHANGED"; profile: string }
  | { type: "COLS_DISPLAYED" }
  | { type: "BOUNDS_CHANGED" }
  | { type: "LINES_REDISPLAYED"; count: number }
  | { type: "AUTOSAVE_PROMPTED"; dsn: string; member?: string }
  | { type: "COMMAND_RETRIEVED"; command: string }
  | { type: "RETURN_EXECUTED"; from: ScreenId }
  | { type: "EXPLAIN_REQUESTED"; term: string }
  | { type: "MESSAGE_SHOWN"; text: string; severity: "info" | "error" };

export interface StepResult {
  state: SimulatorState;
  events: SimEvent[];
}

export type Color = "white" | "cyan" | "green" | "blue" | "red" | "yellow" | "dim";

export type Segment =
  | { kind: "text"; text: string; color?: Color; bold?: boolean }
  | { kind: "field"; id: string; width: number; value: string; color?: Color; password?: boolean; noUpper?: boolean; editorLine?: boolean };

export type Row = Segment[];

export interface PfKeyDef {
  key: number;
  label: string;
}

export interface RenderedScreen {
  title: string;
  rows: Row[];
  fields: string[];
  focus?: string;
  pfKeys: PfKeyDef[];
  message?: Message;
}

export interface ScreenHandler<F extends ScreenFrame = ScreenFrame> {
  render(state: SimulatorState, frame: F): RenderedScreen;
  onEnter(state: SimulatorState, frame: F, fields: Fields): StepResult;
  onPf?(state: SimulatorState, frame: F, key: number, fields: Fields): StepResult | null;
  help: string[];
}
