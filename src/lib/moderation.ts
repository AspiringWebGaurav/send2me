const blockedTerms = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "slur1",
  "slur2",
  "kill yourself",
];

const reservedUsernames = new Set([
  "admin",
  "api",
  "help",
  "terms",
  "privacy",
  "u",
  "dashboard",
  "login",
  "logout",
  "signup",
]);

const collapsedCharMap: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "$": "s",
  "!": "i",
  "7": "t",
};

export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s._]/gu, (match) => collapsedCharMap[match] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function containsLinks(text: string) {
  const urlPattern =
    /((https?:\/\/|www\.)[^\s]+)|(mailto:|ftp:)[^\s]+|([^\s]+\.(com|net|org|io|me|co|app)(\/|\b))/gi;
  return urlPattern.test(text);
}

export function violatesPolicy(text: string) {
  const normalized = normalize(text);
  return blockedTerms.some((term) => normalized.includes(term));
}

export function validateUsername(username: string) {
  const normalized = normalize(username)
    .replace(/\s/g, "")
    .replace(/[.]/g, ".");
  const regex = /^[a-z0-9](?:[a-z0-9_.]{1,18})[a-z0-9]$/;
  if (!regex.test(username)) {
    throw new Error(
      "Username must be 3-20 characters, lowercase letters, numbers, dots, or underscores.",
    );
  }
  if (reservedUsernames.has(normalized)) {
    throw new Error("This username is reserved. Please choose another.");
  }
  return username;
}

export function validateMessage(text: string) {
  if (typeof text !== "string") {
    throw new Error("Message must be a string.");
  }
  const trimmed = text.trim();
  if (trimmed.length < 2) {
    throw new Error("Message must be at least 2 characters.");
  }
  if (trimmed.length > 500) {
    throw new Error("Message must be at most 500 characters.");
  }
  if (violatesPolicy(trimmed)) {
    throw new Error("Message violates our community guidelines.");
  }
  if (containsLinks(trimmed)) {
    throw new Error("Please remove links before sending.");
  }
  return trimmed;
}

export function messageClientHint(text: string) {
  try {
    validateMessage(text);
    return null;
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    return "Message invalid.";
  }
}

export function getReservedUsernames() {
  return Array.from(reservedUsernames);
}
