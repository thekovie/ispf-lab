import type { Metadata } from "next";
import { LabShell } from "@/components/shell/LabShell";

export const metadata: Metadata = {
  title: "Simulator",
  description:
    "The ISPF Lab simulator: log on, navigate the Primary Option Menu, list data sets with 3.4, open member lists and edit records with ISPF line commands. Learn, Practice, Challenge and Sandbox modes. Desktop keyboard required.",
  alternates: { canonical: "/lab" },
  openGraph: { title: "ISPF Lab simulator", url: "/lab" },
};

export default function LabPage() {
  return <LabShell />;
}
