// import { ParsedProfileDraft } from "./parseFreeTextProfile";

export function buildProfilePrompt(rawText: string): string {
  return `
You are helping rewrite a transplant patient or donor profile.

Rules:
- Do NOT add medical advice.
- Do NOT mention payment or compensation.
- Be concise, clear, and respectful.
- Keep factual tone; do not invent details.

Raw profile text:
"""${rawText}"""

Return ONLY valid JSON in this shape:
{
  "summary": string,
  "organ_type": string | null,
  "age": number | null,
  "blood_type": string | null,
  "location": string | null,
  "personal_story": string,
  "safety_flags": string[]
}
`;
}