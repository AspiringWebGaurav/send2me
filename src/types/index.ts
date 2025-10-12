export type TimestampLike = {
  seconds: number;
  nanoseconds: number;
};

export type UserProfile = {
  uid: string;
  email: string;
  username: string;
  linkSlug: string;
  agreedToTOS: boolean;
  agreedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type MessageRecord = {
  id: string;
  toUid: string;
  toUsername: string;
  text: string;
  fromUid: string | null;
  fromUsername: string | null;
  /** Email of the sender (only if sent with identity) */
  fromEmail?: string | null;
  /** Given (first) name of the sender */
  fromGivenName?: string | null;
  /** Family (last) name of the sender */
  fromFamilyName?: string | null;
  /** Full display name (optional legacy field) */
  fromDisplayName?: string | null;
  /** Whether the message was sent anonymously */
  anon: boolean;
  meta: {
    ipHash: string | null;
    uaHash: string | null;
    country: string | null;
    device?: string | null;
  };
  createdAt: Date;
};

export type SessionUser = {
  uid: string;
  email: string;
  username: string | null;
  displayName: string | null;
};

export type ApiSuccess<T extends Record<string, unknown> = Record<string, never>> = {
  ok: true;
} & T;

export type ApiError = {
  ok: false;
  error: string;
  code?: string;
};

export type CreateLinkPayload = {
  username: string;
  agree: boolean;
};

export type SendMessagePayload = {
  to: string;
  text: string;
  anon?: boolean;
};
