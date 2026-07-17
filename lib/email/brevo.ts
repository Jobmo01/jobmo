/**
 * Adds a newly-registered user to Brevo as a contact, in the list matching
 * their role, so the Welcome/onboarding automations built in Brevo's own
 * UI can pick them up automatically.
 *
 * Deliberately fire-and-forget and never throws: this is a marketing side
 * effect, not part of the actual signup flow. If Brevo is misconfigured,
 * rate-limited, or briefly down, a real person's registration must still
 * succeed — we log the failure and move on rather than let an email
 * marketing tool ever block someone from creating a JobMo account.
 */
export async function addContactToBrevo(params: {
  email: string;
  fullName: string | null;
  role: "applicant" | "employer";
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = params.role === "employer" ? process.env.BREVO_EMPLOYER_LIST_ID : process.env.BREVO_APPLICANT_LIST_ID;

  // Not configured yet (e.g. local dev, or before the env vars are set in
  // Vercel) — skip quietly rather than error. This makes the integration
  // safe to deploy before the Brevo setup is fully wired up.
  if (!apiKey || !listId) return;

  try {
    const [firstName, ...rest] = (params.fullName ?? "").trim().split(" ");
    await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        email: params.email,
        listIds: [Number(listId)],
        attributes: {
          FIRSTNAME: firstName || undefined,
          LASTNAME: rest.join(" ") || undefined,
        },
        updateEnabled: true, // if they somehow already exist, update rather than error
      }),
    });
  } catch (e) {
    console.error("Brevo contact sync failed (non-fatal):", e);
  }
}

/**
 * Updates custom attributes on an existing Brevo contact — this is how the
 * 4 data-driven reminders (abandoned profile, high match, interview,
 * employer follow-up) notify Brevo, since Brevo has no way to know about
 * things happening inside JobMo on its own.
 *
 * Deliberately uses the same contacts endpoint as addContactToBrevo()
 * (attribute updates) rather than Brevo's newer custom-events API —
 * "contact attribute updated" is a long-established, reliable Brevo
 * automation trigger; there are multiple reports in Brevo's own community
 * forum of API-created custom events not reliably firing automations,
 * which isn't a risk worth taking for something meant to run unattended
 * every day. Same fail-safe contract as addContactToBrevo(): never throws,
 * silently no-ops if not configured.
 */
export async function updateBrevoContactAttributes(email: string, attributes: Record<string, string | number | boolean>): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  try {
    await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({ attributes }),
    });
  } catch (e) {
    console.error("Brevo attribute update failed (non-fatal):", e);
  }
}
