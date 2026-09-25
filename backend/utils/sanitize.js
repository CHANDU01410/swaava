/**
 * Escapes characters with special meaning in regular expressions
 * to prevent ReDoS and regex injection attacks in MongoDB queries.
 */
export function escapeRegex(text) {
  if (typeof text !== "string") return "";
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export default { escapeRegex };
