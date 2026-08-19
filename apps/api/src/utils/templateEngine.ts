/**
 * Render template text/html by replacing {{placeholder}} with values from variables object.
 */
export function renderTemplate(templateStr: string, variables: Record<string, any>): string {
  if (!templateStr) return '';
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      const val = variables[key];
      return val !== undefined && val !== null ? String(val) : '';
    }
    return match;
  });
}
