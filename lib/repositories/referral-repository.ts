import { createClient } from "@/lib/supabase/server";

// Excludes visually-ambiguous characters (0/O, 1/I/L) so a code read aloud
// or half-remembered doesn't get mistyped.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export const referralRepository = {
  /** Every user gets a referral code lazily, the first time they open
   *  their "Refer friends" section — not generated upfront for every
   *  signup, to avoid touching the existing handle_new_user() trigger. */
  async getOrCreateReferralCode(userId: string): Promise<string> {
    const supabase = await createClient();
    const { data: existing } = await (supabase.from("profiles") as any)
      .select("referral_code")
      .eq("id", userId)
      .maybeSingle();
    if (existing?.referral_code) return existing.referral_code;

    // Collision odds are astronomically low (32^8 possibilities), but a
    // short retry loop costs nothing and makes this fully safe regardless.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      const { error } = await (supabase.from("profiles") as any)
        .update({ referral_code: code })
        .eq("id", userId)
        .is("referral_code", null); // only succeeds if still unset — avoids a race overwriting a code set concurrently
      if (!error) return code;
    }
    throw new Error("Failed to generate a unique referral code after 5 attempts");
  },

  async findReferrerIdByCode(code: string): Promise<string | null> {
    const supabase = await createClient();
    const { data } = await (supabase.from("profiles") as any)
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    return data?.id ?? null;
  },

  /**
   * Records a successful referral. Safe to call even if it somehow fires
   * twice for the same person (referred_id is unique in the database) —
   * the second call just fails quietly rather than double-crediting
   * someone or throwing an error that could disrupt registration.
   */
  async recordReferral(referrerId: string, referredId: string): Promise<void> {
    if (referrerId === referredId) return; // can't refer yourself
    try {
      const supabase = await createClient();
      await (supabase.from("referrals") as any).insert({ referrer_id: referrerId, referred_id: referredId });
    } catch (e) {
      console.error("Failed to record referral (non-fatal):", e);
    }
  },

  async countReferrals(referrerId: string): Promise<number> {
    const supabase = await createClient();
    const { count } = await (supabase.from("referrals") as any)
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", referrerId);
    return count ?? 0;
  },
};
