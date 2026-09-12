/**
 * Virtual data-set catalog types.
 * Reference: docs/02-architecture.md §Catalog, docs/03-ispf-behaviour-reference.md §Data sets.
 * Modelled on z/OS data-set attributes as shown by ISPF 3.2 / 3.4 "I" (information).
 */

export type DatasetType = "PDS" | "PS";
export type Dsorg = "PO" | "PS";
export type Recfm = "FB" | "VB" | "F" | "V" | "U";
export type SpaceUnits = "TRKS" | "CYLS" | "BLKS";

export interface Member {
  name: string;
  records: string[];
  createdAt?: string;
  modifiedAt?: string;
  /** userid that last changed the member (ISPF statistics "ID" column) */
  modifiedBy?: string;
  /** version.mod counter shown in member statistics, e.g. 01.03 */
  version?: number;
  mod?: number;
}

export interface Dataset {
  id: string;
  name: string;
  datasetType: DatasetType;
  dsorg: Dsorg;
  recfm: Recfm;
  lrecl: number;
  blksize: number;
  volume: string;
  readOnly: boolean;
  spaceUnits: SpaceUnits;
  primary: number;
  secondary: number;
  /** directory blocks; > 0 implies PDS */
  dirBlocks: number;
  createdAt: string;
  owner: string;
  members?: Record<string, Member>;
  records?: string[];
}

/** Catalog keyed by upper-cased data set name. */
export interface Catalog {
  version: 1;
  hlq: string;
  datasets: Record<string, Dataset>;
}

export interface AllocateRequest {
  name: string;
  spaceUnits: SpaceUnits;
  primary: number;
  secondary: number;
  dirBlocks: number;
  recfm: Recfm;
  lrecl: number;
  blksize?: number;
  volume?: string;
  owner: string;
}

/** Every mutating catalog function returns this shape; `error` is an ISPF-style message. */
export interface CatalogResult {
  catalog: Catalog;
  error?: string;
}

/** Parsed "DSN(MEMBER)" reference. */
export interface DsnRef {
  dsn: string;
  member?: string;
}
