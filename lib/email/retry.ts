// M16-P01: a Resend 4xx is a permanent refusal (for example the test sender refusing a customer
// address before a sending domain is verified). 408 timeout, 409 idempotency conflict, 429 rate
// limit, 5xx and network errors are transient and stay retryable.
const TRANSIENT_4XX = new Set([408, 409, 429]);

export function isPermanentEmailRefusal(status: number | undefined) {
  return status !== undefined && status >= 400 && status < 500 && !TRANSIENT_4XX.has(status);
}
