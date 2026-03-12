export class InsufficientCreditsError extends Error {
  readonly code = "INSUFFICIENT_CREDITS";
  readonly status = 402;

  constructor(
    public readonly creditsRequired: number,
    public readonly creditsRemaining: number,
    message = "เครดิต SMS ไม่เพียงพอ กรุณาเติมเครดิต",
  ) {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

/**
 * Serializable error result for server action boundaries.
 * Server actions lose custom Error fields during serialization.
 * Return this instead of throwing InsufficientCreditsError.
 */
export type InsufficientCreditsResult = {
  error: "INSUFFICIENT_CREDITS";
  creditsRequired: number;
  creditsRemaining: number;
  message: string;
};

export function toInsufficientCreditsResult(err: InsufficientCreditsError): InsufficientCreditsResult {
  return {
    error: "INSUFFICIENT_CREDITS",
    creditsRequired: err.creditsRequired,
    creditsRemaining: err.creditsRemaining,
    message: err.message,
  };
}

export function throwInsufficientCredits(
  creditsRequired: number,
  creditsRemaining: number,
  message?: string,
): never {
  throw new InsufficientCreditsError(
    creditsRequired,
    creditsRemaining,
    message,
  );
}
