import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Draft lessons (ADR 0018) show in `next dev` and in any build that sets the flag explicitly, never by default.
  env: { NEXT_PUBLIC_SHOW_DRAFT_LESSONS: process.env.NEXT_PUBLIC_SHOW_DRAFT_LESSONS ?? (process.env.NODE_ENV === "development" ? "1" : "") },
};

export default nextConfig;
