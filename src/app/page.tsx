import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";
import { RESOURCES } from "@/content/resources";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, absoluteUrl } from "@/content/site";
import { LESSONS } from "@/tutorial/lessons";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — ${SITE_TAGLINE}` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

/** Structured data: the app, the course it contains, and a FAQ for the questions beginners search for. */
function jsonLd() {
  const url = absoluteUrl("/");
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NAME,
      url,
      description: SITE_DESCRIPTION,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any (desktop browser)",
      browserRequirements: "Desktop browser with a physical keyboard; 1024px or wider viewport",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      image: absoluteUrl("/opengraph-image"),
      keywords: "ISPF, z/OS, TSO, mainframe, ISPF editor, DSLIST, JCL",
    },
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "ISPF Lab course: navigating and editing in IBM z/OS ISPF",
      description: "Fourteen hands-on lessons in a simulated ISPF: the Primary Option Menu, option 3.4, data sets and members, the ISPF editor and its line commands, allocating and copying data sets.",
      provider: { "@type": "Organization", name: SITE_NAME, url },
      isAccessibleForFree: true,
      educationalLevel: "Beginner",
      hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: "PT3H" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", category: "Free" },
      syllabusSections: LESSONS.map((l) => ({ "@type": "Syllabus", name: `${l.number}. ${l.title}`, description: l.description })),
      citation: RESOURCES.map((r) => ({ "@type": "CreativeWork", name: r.title, url: r.url, publisher: r.publisher })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is ISPF?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ISPF (Interactive System Productivity Facility) is the full-screen, panel-driven interface used to work on IBM z/OS mainframes. It runs on top of TSO and is driven by option numbers, PF keys and one-letter line commands.",
          },
        },
        {
          "@type": "Question",
          name: "Is ISPF Lab a real mainframe or an emulator?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. ISPF Lab is a deterministic simulation with a virtual data-set catalog that runs entirely in your browser. It reproduces the ISPF interaction model for training; it is not a z/OS emulator, a TN3270 client or a mainframe connection, and it is not affiliated with IBM.",
          },
        },
        {
          "@type": "Question",
          name: "What is ISPF option 3.4?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Option 3.4 is the Data Set List Utility (DSLIST): you type a data-set name level, get a list of matching data sets, and act on them with line commands such as E (edit), B (browse), M (member list), D (delete) and R (rename).",
          },
        },
        {
          "@type": "Question",
          name: "Do I need an account?",
          acceptedAnswer: { "@type": "Answer", text: "No. Your training catalog, settings and lesson progress are stored in your browser only. There is no sign-up and no server." },
        },
      ],
    },
  ];
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }} />
      <Landing />
    </>
  );
}
