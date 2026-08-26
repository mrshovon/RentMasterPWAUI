"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { apiPublicContact } from "../lib/api-service";
import { validateEmail, validatePhone } from "../lib/validate";
import { toast } from "./toast";
import { useT } from "../lib/i18n";
import { Modal, Field, TextInput, TextArea, EmailField, PhoneField, Button } from "./ui";

// =====================================================================================
// ✉️ CONTACT US — the PUBLIC one, for the /plans pricing page.
//
// A SIBLING of ContactModal in app/owner/page.tsx, not a shared component. That one posts to
// /api/admin/contact-messages with a bearer token and prefills the signed-in owner's name; this
// one has no session at all and posts to /api/app/contact. Making one component serve both would
// mean branching on "is there a session" through every line of it, for a form with four fields.
//
// THE ONE REAL DIFFERENCE IN BEHAVIOUR: an email or a phone number is REQUIRED here. The
// authenticated version can fall back to the owner's account to reach them; here there is no
// account, so an enquiry with neither is one nobody can ever answer — which is worse than no
// enquiry, because the sender believes they have been heard. The backend enforces the same rule.
// =====================================================================================

export function PlanContactModal({
  open, onClose, tierId, tierName,
}: {
  open: boolean;
  onClose: () => void;
  /** The plan being asked about, recorded on the enquiry so the reply can be specific. */
  tierId?: string;
  tierName?: string;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Reset and prefill on every open, so a cancelled enquiry does not reappear half-filled with
  // the previous plan's wording.
  useEffect(() => {
    if (!open) return;
    setName(""); setEmail(""); setPhone("");
    setMessage(
      tierName
        ? t("I'm interested in the {plan} plan. Please get in touch.").replace("{plan}", tierName)
        : ""
    );
  }, [open, tierName, t]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) { toast.error("Please add a message."); return; }

    const parsedEmail = validateEmail(email);
    if (!parsedEmail.ok) { toast.error(parsedEmail.error); return; }
    const parsedPhone = validatePhone(phone);
    if (!parsedPhone.ok) { toast.error(parsedPhone.error); return; }
    if (!parsedEmail.value && !parsedPhone.value) {
      toast.error("Please leave an email address or a phone number so we can reply.");
      return;
    }

    try {
      setSending(true);
      await apiPublicContact({
        name: name.trim(),
        email: parsedEmail.value || "",
        phone: parsedPhone.value || "",
        tierId,
        message: message.trim(),
      });
      toast.success("Thanks — our team will reach out to you soon.");
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Contact us"
      subtitle={tierName ? `${t("Enquiry about the")} ${tierName}` : "Tell us what you need and we will get back to you."}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <PhoneField label="Phone" value={phone} onChange={setPhone} />
        </div>
        <EmailField label="Email" value={email} onChange={setEmail} />
        <p className="text-[11px] text-subtle">{t("Leave an email address or a phone number so we can reply.")}</p>
        <Field label="Message" required>
          <TextArea
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your building and what you need…"
          />
        </Field>
        <Button type="submit" loading={sending} icon={Send} className="w-full">Send enquiry</Button>
      </form>
    </Modal>
  );
}
