/**
 * Variable substitution: {{name}}, {{phone}}, {{date}}, {{custom_key}}
 * Also supports default values: {{name|ลูกค้า}}
 */
export function substituteVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (match, key: string, defaultVal?: string) => {
    if (key in variables) return variables[key];
    if (defaultVal !== undefined) return defaultVal;
    return match; // leave unmatched variables as-is
  });
}

export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)(?:\|[^}]*)?\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/\{\{(\w+)(?:\|[^}]*)?\}\}/, "$1")))];
}
