import type { Metadata } from "next";
import { ProgressView } from "@/components/shell/ProgressView";

export const metadata: Metadata = {
  title: "Learning progress",
  description: "Your ISPF Lab lesson progress, stored in this browser only.",
  robots: { index: false, follow: false },
};

export default function ProgressPage() {
  return <ProgressView />;
}
