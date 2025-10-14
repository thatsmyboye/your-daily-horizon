import { z } from "zod";

// Maximum length for user-generated text content
const MAX_TEXT_LENGTH = 2000;

// List of potentially unsafe patterns (basic content filtering)
const UNSAFE_PATTERNS = [
  /\b(kill|harm|suicide|self-harm)\s+(yourself|myself|themselves)\b/gi,
  /\b(how to|ways to)\s+(die|kill yourself)\b/gi,
];

export const validateUserText = (text: string): { valid: boolean; error?: string } => {
  if (!text) return { valid: true };

  // Truncate to max length
  if (text.length > MAX_TEXT_LENGTH) {
    return {
      valid: false,
      error: `Text must be less than ${MAX_TEXT_LENGTH} characters`,
    };
  }

  // Check for unsafe content
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        valid: false,
        error:
          "Your message contains potentially harmful content. If you're in crisis, please contact a mental health professional or crisis hotline.",
      };
    }
  }

  return { valid: true };
};

export const truncateText = (text: string, maxLength: number = MAX_TEXT_LENGTH): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength);
};

// Schema for daily pulse reflections
export const reflectionSchema = z
  .string()
  .trim()
  .max(MAX_TEXT_LENGTH, { message: `Reflection must be less than ${MAX_TEXT_LENGTH} characters` })
  .refine(
    (val) => {
      const validation = validateUserText(val);
      return validation.valid;
    },
    { message: "Content contains potentially harmful language" }
  );

// Schema for mentor chat messages
export const mentorMessageSchema = z
  .string()
  .trim()
  .nonempty({ message: "Message cannot be empty" })
  .max(MAX_TEXT_LENGTH, { message: `Message must be less than ${MAX_TEXT_LENGTH} characters` })
  .refine(
    (val) => {
      const validation = validateUserText(val);
      return validation.valid;
    },
    { message: "Content contains potentially harmful language" }
  );

// Schema for mission titles and intents
export const missionTextSchema = z
  .string()
  .trim()
  .max(200, { message: "Text must be less than 200 characters" });

// Schema for check-in notes
export const checkInNoteSchema = z
  .string()
  .trim()
  .max(500, { message: "Note must be less than 500 characters" });
