import { z } from "zod";

// Maximum length for user-generated text content
const MAX_TEXT_LENGTH = 2000;

// Crisis resources
export interface CrisisResource {
  name: string;
  phone: string;
  url: string;
  description: string;
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: "988 Suicide & Crisis Lifeline",
    phone: "988",
    url: "https://988lifeline.org",
    description: "24/7 crisis support for suicide prevention and mental health emergencies"
  },
  {
    name: "Crisis Text Line",
    phone: "Text HOME to 741741",
    url: "https://www.crisistextline.org",
    description: "Free, 24/7 text support for people in crisis"
  },
  {
    name: "SAMHSA National Helpline",
    phone: "1-800-662-4357",
    url: "https://www.samhsa.gov/find-help/national-helpline",
    description: "Substance abuse and mental health treatment referral service"
  }
];

// Safety response interface
export interface SafetyResponse {
  valid: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  action?: 'allow' | 'block' | 'redirect' | 'escalate';
  error?: string;
  resources?: CrisisResource[];
}

// Enhanced validation patterns
const ENHANCED_SAFETY_PATTERNS = {
  // Self-harm patterns (critical severity)
  selfHarm: [
    /\b(kill|harm|hurt|injure)\s+(yourself|myself|themselves|oneself)\b/gi,
    /\b(how to|ways to|methods to)\s+(die|kill yourself|end it|end life)\b/gi,
    /\b(suicide|self-harm|self-injury|cutting|burning)\b/gi,
    /\b(overdose|poison|hang|jump|bridge)\s+(yourself|myself)\b/gi,
  ],
  
  // Violence patterns (high severity)
  violence: [
    /\b(kill|murder|harm|hurt|attack|violence)\s+(someone|others|people|them)\b/gi,
    /\b(how to|ways to)\s+(kill|murder|harm|attack)\s+(someone|others)\b/gi,
    /\b(bomb|weapon|gun|knife|poison)\s+(threat|plan|attack)\b/gi,
  ],
  
  // Substance abuse (high severity)
  substanceAbuse: [
    /\b(how to|ways to)\s+(overdose|get high|use drugs|abuse)\b/gi,
    /\b(drug|alcohol|substance)\s+(abuse|addiction|overdose)\b/gi,
  ],
  
  // Crisis indicators (critical severity)
  crisis: [
    /\b(can't go on|want to die|end it all|no point|hopeless)\b/gi,
    /\b(thinking about|considering|planning)\s+(suicide|ending it|death)\b/gi,
  ]
};

export const validateUserText = (text: string): SafetyResponse => {
  if (!text) return { valid: true };

  // Truncate to max length
  if (text.length > MAX_TEXT_LENGTH) {
    return {
      valid: false,
      severity: 'low',
      action: 'block',
      error: `Text must be less than ${MAX_TEXT_LENGTH} characters`,
    };
  }

  // Check for critical self-harm patterns
  for (const pattern of ENHANCED_SAFETY_PATTERNS.selfHarm) {
    if (pattern.test(text)) {
      return {
        valid: false,
        severity: 'critical',
        action: 'escalate',
        error: "Your message contains potentially harmful content. If you're in crisis, please reach out for help immediately.",
        resources: CRISIS_RESOURCES,
      };
    }
  }

  // Check for critical crisis indicators
  for (const pattern of ENHANCED_SAFETY_PATTERNS.crisis) {
    if (pattern.test(text)) {
      return {
        valid: false,
        severity: 'critical',
        action: 'escalate',
        error: "We're concerned about your wellbeing. Please reach out to a crisis support service for immediate help.",
        resources: CRISIS_RESOURCES,
      };
    }
  }

  // Check for violence patterns
  for (const pattern of ENHANCED_SAFETY_PATTERNS.violence) {
    if (pattern.test(text)) {
      return {
        valid: false,
        severity: 'high',
        action: 'block',
        error: "Your message contains content that suggests harm to others. This type of content is not allowed.",
        resources: CRISIS_RESOURCES,
      };
    }
  }

  // Check for substance abuse patterns
  for (const pattern of ENHANCED_SAFETY_PATTERNS.substanceAbuse) {
    if (pattern.test(text)) {
      return {
        valid: false,
        severity: 'high',
        action: 'redirect',
        error: "Your message contains content related to substance abuse. If you need help, please contact a support service.",
        resources: CRISIS_RESOURCES,
      };
    }
  }

  return { valid: true, severity: 'low', action: 'allow' };
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
