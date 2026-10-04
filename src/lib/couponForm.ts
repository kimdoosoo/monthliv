/**
 * The coupon form shared by the host centre and the admin: read what was submitted (GET
 * parameters), check it, and build the coupon it describes. In this preview nothing is saved;
 * the page shows the coupon it would have created and who it would go to.
 */
import type { Coupon } from "@/data/coupons";
import { addDays } from "@/lib/pricing";

type Params = Record<string, string | string[] | undefined>;

export type CouponFormValues = {
  title: string;
  kind: "amount" | "percent";
  value: string;
  max: string;
  minNights: string;
  minTotal: string;
  expires: string;
  audience: "users" | "code";
  code: string;
  limit: string;
  to: string[];
  ids: string;
};

export type CouponFormError =
  | { key: "title" }
  | { key: "amount" }
  | { key: "percent" }
  | { key: "max" }
  | { key: "number" }
  | { key: "expires" }
  | { key: "code" }
  | { key: "codeTaken"; code: string }
  | { key: "noRecipients" }
  | { key: "unknownIds"; ids: string };

export type CouponFormResult = {
  submitted: boolean;
  values: CouponFormValues;
  errors: CouponFormError[];
  coupon?: Coupon;
  recipients: string[];
};

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const many = (value: string | string[] | undefined) => (Array.isArray(value) ? value : value ? [value] : []);
/**
 * A whole number as typed: thousands separators and spaces are fine, anything else (a decimal
 * point, a minus sign, letters) is not. Empty is 0; not a whole number is NaN.
 */
function whole(value: string): number {
  const clean = value.replace(/[\s,]/g, "");
  if (!clean) return 0;
  return /^\d{1,9}$/.test(clean) ? Number(clean) : Number.NaN;
}

/** A short code for a sent coupon, PREFIX-XXXX, that isn't in use yet. */
function codeFor(prefix: string, seed: string, taken: string[]): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const head = prefix.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "ML";
  for (let attempt = 0; ; attempt += 1) {
    let hash = 2166136261;
    for (const char of `${seed}|${attempt}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
    let code = "";
    for (let index = 0; index < 4; index += 1) {
      code += letters[hash % letters.length];
      hash = Math.floor(hash / letters.length) + index * 7919;
    }
    const candidate = `${head}-${code}`;
    if (!taken.includes(candidate)) return candidate;
  }
}

export function readCouponForm(
  params: Params,
  options: {
    issuer: "admin" | "host";
    hostId?: string;
    today: string;
    /** Member IDs this issuer may send to. */
    canSendTo: (id: string) => boolean;
    /** Codes already in use. */
    takenCodes: string[];
    defaults?: Partial<CouponFormValues>;
  },
): CouponFormResult {
  const submitted = one(params.send) === "1";
  const values: CouponFormValues = {
    title: one(params.title).trim().slice(0, 40),
    kind: one(params.kind) === "percent" ? "percent" : "amount",
    value: one(params.value),
    max: one(params.max),
    minNights: one(params.minNights),
    minTotal: one(params.minTotal),
    expires: one(params.expires) || addDays(options.today, 60),
    audience: options.issuer === "admin" && one(params.audience) === "code" ? "code" : "users",
    code: one(params.code).trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20),
    limit: one(params.limit),
    to: many(params.to),
    ids: one(params.ids),
    ...(submitted ? {} : options.defaults),
  };
  if (!submitted) return { submitted, values, errors: [], recipients: [] };

  const errors: CouponFormError[] = [];
  if (!values.title) errors.push({ key: "title" });
  const value = whole(values.value);
  const max = whole(values.max);
  const minNights = whole(values.minNights);
  const minTotal = whole(values.minTotal);
  const limit = whole(values.limit);
  if (values.kind === "amount" && !(value >= 1000 && value <= 100000)) errors.push({ key: "amount" });
  if (values.kind === "percent" && !(value >= 1 && value <= 50)) errors.push({ key: "percent" });
  // A percent coupon always has a ceiling, or a season-long stay could take millions off.
  if (values.kind === "percent" && !(max >= 1000 && max <= 100000)) errors.push({ key: "max" });
  if ([minNights, minTotal, limit].some(Number.isNaN)) errors.push({ key: "number" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.expires) || values.expires < options.today || values.expires > addDays(options.today, 366)) {
    errors.push({ key: "expires" });
  }

  const typed = values.ids
    .split(/[\s,;]+/)
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
  const recipients = [...new Set([...values.to, ...typed])];
  if (values.audience === "users") {
    const unknown = recipients.filter((id) => !options.canSendTo(id));
    if (recipients.length === 0) errors.push({ key: "noRecipients" });
    if (unknown.length) errors.push({ key: "unknownIds", ids: unknown.join(", ") });
  } else {
    if (!/^[A-Z0-9][A-Z0-9-]{3,19}$/.test(values.code)) errors.push({ key: "code" });
    else if (options.takenCodes.includes(values.code)) errors.push({ key: "codeTaken", code: values.code });
  }
  if (errors.length) return { submitted, values, errors, recipients };

  const amount = values.kind === "amount" ? Math.round(value / 1000) * 1000 : value;
  const coupon: Coupon = {
    id: "new",
    code:
      values.audience === "code"
        ? values.code
        : codeFor(
            options.issuer === "host" ? (options.hostId ?? "HOST") : "ML",
            `${values.title}|${values.expires}|${[...recipients].sort().join(",")}`,
            options.takenCodes,
          ),
    title: { ko: values.title, en: values.title },
    kind: values.kind,
    value: amount,
    maxDiscount: values.kind === "percent" ? max : undefined,
    minNights: minNights || undefined,
    minTotal: options.issuer === "admin" && minTotal ? minTotal : undefined,
    expires: values.expires,
    issuer: options.issuer,
    hostId: options.issuer === "host" ? options.hostId : undefined,
    audience: values.audience,
    sentTo: values.audience === "users" ? recipients : undefined,
    limit: values.audience === "code" && limit ? limit : undefined,
    used: 0,
    createdOn: options.today,
  };
  return { submitted, values, errors, coupon, recipients: values.audience === "users" ? recipients : [] };
}
