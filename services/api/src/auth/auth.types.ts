export type SupportedPhoneCountry = 'ID' | 'MY';
export type SupportedLanguage = 'ID_ID' | 'MS_MY' | 'EN';
export type SupportedOtpChannel = 'WHATSAPP' | 'SMS';
export type SupportedOtpPurpose =
  | 'REGISTER'
  | 'LOGIN_CHALLENGE'
  | 'RESET_PASSWORD'
  | 'CHANGE_PHONE'
  | 'DELETE_ACCOUNT';

export type RequestOtpInput = {
  country: SupportedPhoneCountry;
  phone: string;
  channel: SupportedOtpChannel;
  language: SupportedLanguage;
  purpose?: SupportedOtpPurpose;
};

export type VerifyOtpInput = {
  challengeId: string;
  code: string;
};

export type RegisterInput = {
  challengeId: string;
  verificationToken: string;
  fullName: string;
  password: string;
  email?: string;
  preferredLanguage?: SupportedLanguage;
  deviceName?: string;
  platform?: string;
};

export type LoginInput = {
  login: string;
  country?: SupportedPhoneCountry;
  password: string;
  deviceName?: string;
  platform?: string;
};

export type RefreshInput = {
  refreshToken: string;
  deviceName?: string;
  platform?: string;
};

export type UpdateProfileInput = {
  fullName?: string;
  email?: string | null;
  birthDate?: string | null;
  preferredLanguage?: SupportedLanguage;
};

export type ResetPasswordInput = {
  challengeId: string;
  verificationToken: string;
  newPassword: string;
};

export type RequestChangePhoneOtpInput = {
  country: SupportedPhoneCountry;
  phone: string;
  channel: SupportedOtpChannel;
  language: SupportedLanguage;
};

export type ConfirmChangePhoneInput = {
  challengeId: string;
  verificationToken: string;
};

export type RequestDeleteAccountOtpInput = {
  channel: SupportedOtpChannel;
  language: SupportedLanguage;
};

export type ConfirmDeleteAccountInput = {
  challengeId: string;
  verificationToken: string;
};
