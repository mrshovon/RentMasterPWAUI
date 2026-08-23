"use client";

import { LegalPage } from "../../components/legal-page";
import { LEGAL_DOCS } from "../../content/legal/generated";

// Public — no session guard. Linked from the signup consent checkbox, so it has to be readable
// before an account exists. Section 9 is the data-storage policy.
export default function TermsPage() {
  return <LegalPage en={LEGAL_DOCS.termsEn} bn={LEGAL_DOCS.termsBn} />;
}
