"use client";

import { LegalPage } from "../../components/legal-page";
import { LEGAL_DOCS } from "../../content/legal/generated";

// Public — no session guard. Google Play requires a reachable privacy policy URL, and this is it:
// https://www.bari360.space/privacy. The Android shell loads the hosted site, so it is live in the
// app as soon as this deploys.
export default function PrivacyPage() {
  return <LegalPage doc="privacy" en={LEGAL_DOCS.privacyEn} bn={LEGAL_DOCS.privacyBn} />;
}
