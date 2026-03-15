// Minimal Bun type declarations for password hashing
// Using Bun.password API without full @types/bun (conflicts with Next.js fetch types)

declare namespace Bun {
  namespace password {
    function hash(
      password: string,
      options?: {
        algorithm?: "argon2id" | "argon2i" | "argon2d" | "bcrypt";
        memoryCost?: number;
        timeCost?: number;
      },
    ): Promise<string>;

    function verify(password: string, hash: string): Promise<boolean>;
  }
}
