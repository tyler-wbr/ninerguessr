/** Shared registration / display-name validation (client + server safe). */

export const DISPLAY_NAME_MIN = 3;
export const DISPLAY_NAME_MAX = 24;
export const NAME_MIN = 2;
export const NAME_MAX = 50;
export const PASSWORD_MIN = 8;

const DISPLAY_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _'.-]*[A-Za-z0-9]$/;
const PERSON_NAME_PATTERN = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

/** Normalized substrings checked against display names. */
const BLOCKED_TERMS = [
  "asshole",
  "bastard",
  "bitch",
  "bullshit",
  "cock",
  "crap",
  "cunt",
  "damn",
  "dick",
  "fag",
  "fuck",
  "hell",
  "nigger",
  "nigga",
  "piss",
  "pussy",
  "shit",
  "slut",
  "twat",
  "whore",
];

function normalizeForProfanityCheck(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[@4]/g, "a")
    .replace(/[8]/g, "b")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[7+]/g, "t")
    .replace(/[^a-z0-9\s]/g, "");
}

function containsBlockedLanguage(value: string): boolean {
  const normalized = normalizeForProfanityCheck(value);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const haystack = ` ${normalized} `;

  for (const term of BLOCKED_TERMS) {
    if (haystack.includes(` ${term} `) || tokens.some((t) => t === term)) {
      return true;
    }
    if (normalized.includes(term)) {
      return true;
    }
  }
  return false;
}

export function validatePersonName(
  value: string,
  label: "First name" | "Last name",
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: `${label} is required.` };
  }
  if (trimmed.length < NAME_MIN) {
    return {
      ok: false,
      error: `${label} must be at least ${NAME_MIN} characters.`,
    };
  }
  if (trimmed.length > NAME_MAX) {
    return {
      ok: false,
      error: `${label} must be ${NAME_MAX} characters or fewer.`,
    };
  }
  if (!PERSON_NAME_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error: `${label} may only contain letters, spaces, hyphens, and apostrophes.`,
    };
  }
  return { ok: true, value: trimmed };
}

export function validateDisplayName(
  value: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: "Display name is required." };
  }
  if (trimmed.length < DISPLAY_NAME_MIN) {
    return {
      ok: false,
      error: `Display name must be at least ${DISPLAY_NAME_MIN} characters.`,
    };
  }
  if (trimmed.length > DISPLAY_NAME_MAX) {
    return {
      ok: false,
      error: `Display name must be ${DISPLAY_NAME_MAX} characters or fewer.`,
    };
  }
  if (/^\d+$/.test(trimmed)) {
    return {
      ok: false,
      error: "Display name cannot be numbers only.",
    };
  }
  if (!/[A-Za-z]/.test(trimmed)) {
    return {
      ok: false,
      error: "Display name must include at least one letter.",
    };
  }
  if (!DISPLAY_NAME_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error:
        "Display name may use letters, numbers, spaces, and . _ ' - (no leading/trailing spaces or special characters).",
    };
  }
  if (/(.)\1{3,}/.test(trimmed)) {
    return {
      ok: false,
      error: "Display name cannot repeat the same character four or more times.",
    };
  }
  if (containsBlockedLanguage(trimmed)) {
    return {
      ok: false,
      error: "Display name contains inappropriate language.",
    };
  }
  return { ok: true, value: trimmed };
}

export function validateEmail(
  value: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: "Email is required." };
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (trimmed.length > 254) {
    return { ok: false, error: "Email is too long." };
  }
  return { ok: true, value: trimmed.toLowerCase() };
}

export function validatePassword(
  value: string,
): { ok: true; value: string } | { ok: false; error: string } {
  if (!value) {
    return { ok: false, error: "Password is required." };
  }
  if (value.length < PASSWORD_MIN) {
    return {
      ok: false,
      error: `Password must be at least ${PASSWORD_MIN} characters.`,
    };
  }
  return { ok: true, value };
}

export type RegistrationFields = {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  password: string;
};

export type RegistrationFieldErrors = Partial<
  Record<keyof RegistrationFields, string>
>;

export function validateRegistrationFields(
  fields: RegistrationFields,
): { ok: true; values: RegistrationFields } | { ok: false; errors: RegistrationFieldErrors } {
  const errors: RegistrationFieldErrors = {};

  const firstName = validatePersonName(fields.firstName, "First name");
  if (!firstName.ok) errors.firstName = firstName.error;

  const lastName = validatePersonName(fields.lastName, "Last name");
  if (!lastName.ok) errors.lastName = lastName.error;

  const displayName = validateDisplayName(fields.displayName);
  if (!displayName.ok) errors.displayName = displayName.error;

  const email = validateEmail(fields.email);
  if (!email.ok) errors.email = email.error;

  const password = validatePassword(fields.password);
  if (!password.ok) errors.password = password.error;

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    values: {
      firstName: firstName.ok ? firstName.value : fields.firstName,
      lastName: lastName.ok ? lastName.value : fields.lastName,
      displayName: displayName.ok ? displayName.value : fields.displayName,
      email: email.ok ? email.value : fields.email,
      password: password.ok ? password.value : fields.password,
    },
  };
}
