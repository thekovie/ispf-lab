/**
 * ScreenId → handler registry. The reducer dispatches through this table so
 * navigation logic never lives in React components.
 */
import type { ScreenFrame, ScreenHandler, ScreenId } from "./types";
import { loginScreen } from "./screens/login";
import { primaryMenuScreen } from "./screens/primaryMenu";
import { settingsScreen } from "./screens/settings";
import { utilitiesScreen } from "./screens/utilities";
import { editEntryScreen } from "./screens/editEntry";
import { datasetInfoScreen, datasetUtilityScreen, libraryUtilityScreen } from "./screens/datasetPanels";
import { allocateScreen } from "./screens/allocateDataset";
import { moveCopyScreen } from "./screens/moveCopy";
import { dslistSearchScreen } from "./screens/dslistSearch";
import { dslistResultsScreen } from "./screens/dslistResults";
import { memberListScreen } from "./screens/memberList";
import { editorScreen } from "./screens/editor";
import { confirmDeleteScreen, copyMovePopupScreen, messageScreen, renameScreen } from "./screens/dialogs";
import { tsoCommandScreen } from "./screens/tsoCommand";
import { helpScreen } from "./screens/help";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = ScreenHandler<any>;

const HANDLERS: Record<ScreenId, AnyHandler> = {
  LOGIN: loginScreen,
  PRIMARY_OPTION_MENU: primaryMenuScreen,
  SETTINGS: settingsScreen,
  UTILITY_SELECTION: utilitiesScreen,
  EDIT_ENTRY: editEntryScreen,
  LIBRARY_UTILITY: libraryUtilityScreen,
  DATASET_UTILITY: datasetUtilityScreen,
  ALLOCATE_DATASET: allocateScreen,
  MOVE_COPY: moveCopyScreen,
  DSLIST_SEARCH: dslistSearchScreen,
  DSLIST_RESULTS: dslistResultsScreen,
  DATASET_INFO: datasetInfoScreen,
  MEMBER_LIST: memberListScreen,
  EDIT: editorScreen,
  BROWSE: editorScreen,
  VIEW: editorScreen,
  CONFIRM_DELETE: confirmDeleteScreen,
  RENAME: renameScreen,
  COPY_MOVE: copyMovePopupScreen,
  TSO_COMMAND: tsoCommandScreen,
  HELP: helpScreen,
  MESSAGE: messageScreen,
};

export function getHandler(id: ScreenId): AnyHandler | undefined {
  return HANDLERS[id];
}

export function handlerFor(frame: ScreenFrame): AnyHandler {
  return HANDLERS[frame.id];
}
