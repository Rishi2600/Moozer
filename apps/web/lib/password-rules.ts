// The four password rules shown on Create account, checked again on the server.
export const PASSWORD_RULES = [
  { id: "length", label: "8 or more characters", test: (p: string) => p.length >= 8 },
  { id: "case", label: "An uppercase and a lowercase letter", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: "number", label: "A number", test: (p: string) => /\d/.test(p) },
  { id: "symbol", label: "A symbol such as ! or @", test: (p: string) => /[^A-Za-z0-9\s]/.test(p) },
] as const;

export function meetsPasswordRules(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
