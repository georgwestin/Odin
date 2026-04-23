import { getAccessToken } from "@/lib/api";

const WALLET_API = process.env.NEXT_PUBLIC_WALLET_API_URL || "http://localhost:8002";

async function walletFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${WALLET_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Wallet API error: ${res.status}`);
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────

export enum PaymentStatus {
  CREATED = "CREATED",
  IN_PROGRESS = "IN_PROGRESS",
  AUTHORIZED = "AUTHORIZED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export type ScaMethod = "redirect" | "qr";

export interface DepositResponse {
  paymentId: string;
  redirectUrl?: string;
  qrCodeData?: string;
  scaMethod: ScaMethod;
}

export interface DepositStatus {
  status: PaymentStatus;
  amount: number;
  currency: string;
  updatedAt: string;
}

// ── Mock mode ──────────────────────────────────────────────────────────

const MOCK_MODE =
  typeof window !== "undefined" &&
  (process.env.NEXT_PUBLIC_MOCK_PAYMENTS === "true" ||
    !process.env.NEXT_PUBLIC_API_URL);

const mockPayments = new Map<
  string,
  { status: PaymentStatus; amount: number; currency: string; createdAt: number }
>();

function generateId(): string {
  return "pay_" + Math.random().toString(36).slice(2, 12);
}

async function mockInitiateDeposit(
  amount: number,
  currency: string,
  _region: string
): Promise<DepositResponse> {
  await new Promise((r) => setTimeout(r, 1000));

  const paymentId = generateId();
  mockPayments.set(paymentId, {
    status: PaymentStatus.CREATED,
    amount,
    currency,
    createdAt: Date.now(),
  });

  // Simulate status progression in background
  setTimeout(() => {
    const p = mockPayments.get(paymentId);
    if (p) p.status = PaymentStatus.IN_PROGRESS;
  }, 2000);

  setTimeout(() => {
    const p = mockPayments.get(paymentId);
    if (p) p.status = PaymentStatus.AUTHORIZED;
  }, 4000);

  setTimeout(() => {
    const p = mockPayments.get(paymentId);
    if (p) p.status = PaymentStatus.COMPLETED;
  }, 6000);

  const callbackUrl = `${window.location.origin}/wallet/deposit/callback?paymentId=${paymentId}`;

  return {
    paymentId,
    redirectUrl: callbackUrl,
    scaMethod: "redirect",
  };
}

async function mockGetDepositStatus(paymentId: string): Promise<DepositStatus> {
  await new Promise((r) => setTimeout(r, 300));

  const payment = mockPayments.get(paymentId);
  if (!payment) {
    return {
      status: PaymentStatus.COMPLETED,
      amount: 0,
      currency: "EUR",
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    updatedAt: new Date().toISOString(),
  };
}

// ── Public API ─────────────────────────────────────────────────────────

export async function initiateDeposit(
  amount: number,
  currency: string,
  region: string
): Promise<DepositResponse> {
  if (MOCK_MODE) {
    return mockInitiateDeposit(amount, currency, region);
  }

  return walletFetch<DepositResponse>("/wallet/deposit/initiate", {
    method: "POST",
    body: JSON.stringify({ amount, currency, region }),
  });
}

export async function getDepositStatus(
  paymentId: string
): Promise<DepositStatus> {
  if (MOCK_MODE) {
    return mockGetDepositStatus(paymentId);
  }

  return walletFetch<DepositStatus>(`/wallet/deposit/status/${paymentId}`);
}
