import type { Account, Privacy, Visibility } from "./api/types"
import { jalaliFull } from "./date"

/**
 * Account metadata for the profile screen.
 *
 * The account itself now comes from GET /account/me, so there is no seed
 * object here any more. What remains is the copy that turns each privacy flag
 * into something a person can actually decide about.
 *
 * Every hint states a consequence rather than naming the field, because
 * hiding a field does more than hide it: the backend stops matching on it, so
 * a private occupation removes you from every occupation search. Nobody could
 * infer that from a switch labelled "occupation".
 */

export type { Account, Privacy, Visibility }

export type PrivacyField = {
  key: keyof Omit<Privacy, "is_profile_discoverable">
  label: string
  /** Optional. Only present when the label alone is not self-explanatory. */
  hint?: string
}

/* All eleven field-level toggles the API documents. profile_picture and
   social_links were missing before and are the two people ask about most.
   Most labels are self-explanatory, so hints only explain the ones that are
   genuinely ambiguous. */
export const PRIVACY_FIELDS: PrivacyField[] = [
  { key: "profile_picture_visibility", label: "عکس پروفایل" },
  { key: "first_name_visibility", label: "نام" },
  { key: "last_name_visibility", label: "نام خانوادگی" },
  {
    key: "nickname_visibility",
    label: "نام نمایشی",
    hint: "نامی که وقتی نام واقعی‌تان خصوصی است نشان داده می‌شود.",
  },
  {
    key: "username_visibility",
    label: "نام کاربری تلگرام",
    hint: "از تلگرام می‌آید و قابل تغییر نیست.",
  },
  { key: "occupation_visibility", label: "شغل" },
  { key: "country_visibility", label: "کشور" },
  {
    key: "bio_visibility",
    label: "معرفی",
    hint: "متنی که درباره خودتان می‌نویسید.",
  },
  { key: "social_links_visibility", label: "شبکه‌های اجتماعی" },
  {
    key: "phone_number_visibility",
    label: "شماره تلفن",
    hint: "توصیه می‌شود خصوصی بماند.",
  },
  {
    key: "whatsapp_number_visibility",
    label: "شماره واتس‌اپ",
    hint: "اگر عمومی باشد، دیگران می‌توانند به شما پیام بدهند.",
  },
]

/** join_date is unix seconds; null when the API withholds it. */
export function formatJoinDate(seconds: number | null): string {
  if (!seconds) return "\u0646\u0627\u0645\u0634\u062e\u0635"
  return jalaliFull(seconds)
}
