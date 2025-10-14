// moderation.ts — same UX, expanded multilingual abuse detection (no API)

const blockedTerms = [
  // English
  "fuck", "shit", "bitch", "cunt", "asshole", "bastard", "slut", "whore",
  "dick", "pussy", "faggot", "retard", "moron", "stupid", "dumbass",
  "motherfucker", "fuk", "fcuk", "fck", "loser", "jerk", "pervert",
  "idiot", "screw you", "bullshit", "trash", "garbage", "waste",
  "kill yourself", "go die", "kms", "kys",

  // Hindi
  "chutiya", "madarchod", "bhenchod", "gaand", "randi", "haraami", "kamina",
  "kutte", "kutti", "suar", "lavde", "launde", "lund", "randi ke bacche",
  "chod", "chodna", "chodne", "tera baap", "teri maa", "teri behen",
  "ullu ke pathe", "behen ke laude", "muh me le", "teri maa ka", "randi ka baccha",

  // Marathi
  "lavda", "gaand", "chod", "zavlya", "randi", "haraami", "bayko chod",
  "madrchod", "bhenchod", "porki", "gandu", "salli", "chinal", "shikarna",
  "padu", "khalya", "lavkar mar", "boka", "randi cha pille", "zop la lav",

  // disguised / leetspeak / modern abuse
  "f@ck", "phuck", "fking", "fukking", "b!tch", "b@stard", "b@st@rd",
  "m0therfucker", "d1ck", "p3nis", "pusy", "s3x", "horny", "r@pe", "rapist",
  "molest", "sexual assault", "harass", "sexually harass", "pedophile",
  "pedo", "child abuse", "kill u", "go to hell", "hate you",

  // placeholders
  "slur1", "slur2",
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
  "5": "s",
  "9": "g",
  "8": "b",
  "2": "z",
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
    /((https?:\/\/|www\.)[^\s]+)|(mailto:|ftp:)[^\s]+|([^\s]+\.(com|net|org|io|me|co|app|xyz|in|gov)(\/|\b))/gi;
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
      "Username must be 3-20 characters, lowercase letters, numbers, dots, or underscores."
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