/**
 * Site-wide SEO constants. Set NEXT_PUBLIC_SITE_URL in production (see .env.example) so absolute
 * URLs in Open Graph tags, the sitemap and JSON-LD point at the deployed origin.
 */
export const SITE_NAME = "ISPF Lab";
export const SITE_TAGLINE = "Learn IBM z/OS ISPF by typing, not by reading about it";
export const SITE_DESCRIPTION =
  "ISPF Lab is a free, browser-based simulator of the IBM z/OS ISPF interface: Primary Option Menu, option 3.4 DSLIST, member lists and the record-oriented ISPF editor with line commands. 14 guided lessons check what you actually do. Runs entirely in your browser. Not affiliated with or endorsed by IBM.";
export const SITE_KEYWORDS = [
  "ISPF",
  "ISPF tutorial",
  "ISPF simulator",
  "learn ISPF",
  "z/OS",
  "TSO",
  "mainframe training",
  "ISPF editor",
  "ISPF line commands",
  "option 3.4",
  "DSLIST",
  "partitioned data set",
  "JCL",
  "3270 terminal",
  "mainframe for beginners",
];

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
