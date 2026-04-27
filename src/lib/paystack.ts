import crypto from "crypto";

const BASE = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

async function paystackReq<T>(method: string, path: string, body?: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = (await res.json()) as { status: boolean; message: string; data: T };
  if (!json.status) throw new Error(json.message ?? "Paystack request failed");
  return json.data;
}

export interface InitTxResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface VerifyTxResult {
  status: string;
  customer: { customer_code: string; email: string };
  subscription?: { subscription_code: string; email_token: string };
  metadata?: Record<string, unknown>;
}

export function initializeTransaction(params: {
  email: string;
  amount: number;
  plan: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}): Promise<InitTxResult> {
  return paystackReq("POST", "/transaction/initialize", params);
}

export function verifyTransaction(reference: string): Promise<VerifyTxResult> {
  return paystackReq("GET", `/transaction/verify/${encodeURIComponent(reference)}`);
}

export function disableSubscription(code: string, token: string): Promise<unknown> {
  return paystackReq("POST", "/subscription/disable", { code, token });
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const hash = crypto.createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  return hash === signature;
}
