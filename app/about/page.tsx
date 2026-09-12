"use client";

import { LegalPage } from "../../components/legal-page";
import { LEGAL_DOCS } from "../../content/legal/generated";

// Public — no session guard, same as /privacy and /terms. Someone deciding whether to sign up
// reads this before an account exists, and it is linked from the signed-out login screen.
export default function AboutPage() {
  return <LegalPage doc="about" en={LEGAL_DOCS.aboutEn} bn={LEGAL_DOCS.aboutBn} />;
}
