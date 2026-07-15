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
