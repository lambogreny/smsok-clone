const TEMPLATE_TOKEN_REGEX = /\{\{\s*([A-Za-z0-9_.-]+)(?:\|([^}]*))?\s*\}\}/g;

const TEMPLATE_SAMPLE_VALUES: Record<string, string> = {
  amount: "999.00",
  code: "CODE123",
  company: "SMSOK",
  custom: "custom-value",
  date: "2026-03-16",
  discount: "20",
  event: "Appointment",
  message: "Important update",
  name: "Customer",
  order_id: "ORD-20260316",
  otp: "482915",
  phone: "0812345678",
  time: "14:00",
  tracking_url: "https://smsok.example/track/ABC123",
  url: "https://smsok.example",
};

const TEMPLATE_WORST_CASE_VALUES: Record<string, string> = {
  amount: "99999.99",
  code: "LONGCODE-123456",
  company: "SMSOK Platform Suite",
  custom: "custom-field-long-value",
  date: "2026-12-31",
  discount: "100",
  event: "Important recurring reminder",
  message: "This is a longer notification message",
  name: "Very Important Customer",
  order_id: "ORD-20260316-999999",
  otp: "999999",
  phone: "0891234567",
  time: "23:59",
  tracking_url: "https://smsok.example/track/ABCDEFGHIJKLMN",
  url: "https://smsok.example/promotions/spring-sale",
};

export type TemplateVariableToken = {
  defaultValue?: string;
  key: string;
};

export function extractVariableTokens(template: string): TemplateVariableToken[] {
  const uniqueTokens = new Map<string, TemplateVariableToken>();

  for (const match of template.matchAll(TEMPLATE_TOKEN_REGEX)) {
    const key = match[1]?.trim();
    if (!key) continue;

    if (!uniqueTokens.has(key)) {
      uniqueTokens.set(key, {
        key,
        ...(match[2] !== undefined ? { defaultValue: match[2].trim() } : {}),
      });
    }
  }

  return [...uniqueTokens.values()];
}

function hasVariableValue(variables: Record<string, string>, key: string) {
  return Object.prototype.hasOwnProperty.call(variables, key);
}

function getTemplateSampleValue(
  key: string,
  defaultValue: string | undefined,
  mode: "preview" | "worst-case",
) {
  if (defaultValue && defaultValue.length > 0) {
    return defaultValue;
  }

  const lookupKey = key.split(".").pop() ?? key;
  const values = mode === "preview" ? TEMPLATE_SAMPLE_VALUES : TEMPLATE_WORST_CASE_VALUES;
  return values[key] ?? values[lookupKey] ?? (mode === "preview" ? "sample-value" : "sample-value-long");
}

export function findTemplateSyntaxWarnings(template: string): string[] {
  const warnings: string[] = [];
  const openCount = (template.match(/\{\{/g) ?? []).length;
  const closeCount = (template.match(/\}\}/g) ?? []).length;

  if (openCount !== closeCount) {
    warnings.push("Unmatched template braces");
  }

  if (/\{\{\s*(?:\|[^}]*)?\}\}/.test(template)) {
    warnings.push("Template variable name is required");
  }

  return warnings;
}

/**
 * Variable substitution: {{name}}, {{phone}}, {{custom.field}}
 * Also supports default values: {{name|Customer}}
 */
export function substituteVariables(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(TEMPLATE_TOKEN_REGEX, (match, rawKey: string, defaultVal?: string) => {
    const key = rawKey.trim();
    if (hasVariableValue(variables, key)) return variables[key];
    if (defaultVal !== undefined) return defaultVal;
    return match;
  });
}

export function extractVariables(template: string): string[] {
  return extractVariableTokens(template).map((token) => token.key);
}

export function buildTemplatePreview(
  template: string,
  variables: Record<string, string> = {},
) {
  const tokens = extractVariableTokens(template);
  const missing = tokens
    .filter((token) => !hasVariableValue(variables, token.key))
    .map((token) => token.key);

  const previewVariables = Object.fromEntries(tokens.map((token) => {
    const previewValue = hasVariableValue(variables, token.key)
      ? variables[token.key]
      : getTemplateSampleValue(token.key, token.defaultValue, "preview");

    return [token.key, previewValue];
  }));

  const worstCaseVariables = Object.fromEntries(tokens.map((token) => {
    const previewValue = previewVariables[token.key];
    const worstCaseValue = getTemplateSampleValue(token.key, token.defaultValue, "worst-case");
    return [token.key, worstCaseValue.length > previewValue.length ? worstCaseValue : previewValue];
  }));

  return {
    missing,
    previewVariables,
    rendered: substituteVariables(template, previewVariables),
    syntaxWarnings: findTemplateSyntaxWarnings(template),
    variables: tokens.map((token) => token.key),
    worstCaseRendered: substituteVariables(template, worstCaseVariables),
    worstCaseVariables,
  };
}
