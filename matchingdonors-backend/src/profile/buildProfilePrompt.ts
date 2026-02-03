// import { ParsedProfileDraft } from "./parseFreeTextProfile";

export function buildProfilePrompt(rawText: string): string {
  return `
You are a medical profile assistant for an organ donation matching platform. 
Generate a structured profile from the user's description, and you are helping rewrite a transplant patient or donor profile.

Rules:
- Do NOT include medical advice or prognosis
- Remove specific timelines like "for 20 years"
- Return ONLY the JSON object, no other text;
- Do NOT mention payment or compensation.
- Be concise, clear, and respectful.
- Keep factual tone; do not invent details.

User Input:"${rawText}"

Extract and return ONLY a valid JSON object with these fields:
{
  "summary": "One-sentence summary (name, age, blood type, organ)",
  "organ_type": "kidney|liver|heart|lung|pancreas|marrow|etc (null if not mentioned)",
  "age": number (null if not mentioned),
  "blood_type": "A+|A-|B+|B-|AB+|AB-|O+|O- (null if not mentioned)",
  "location": "City, State, Country format (null if not mentioned)",
  "personal_story": "2-3 sentences about their situation and preferences",
  "safety_flags": ["array of removed medical advice or timeline predictions"]
}
`;
}