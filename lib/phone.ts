import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export type PhoneCountry = {
  iso: CountryCode;
  name: string;
  dialCode: string;
};

export const DEFAULT_PHONE_COUNTRY: CountryCode = "ID";

let cachedCountries: PhoneCountry[] | null = null;

export function getPhoneCountries(): PhoneCountry[] {
  if (cachedCountries) return cachedCountries;
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  cachedCountries = getCountries()
    .map((iso) => ({
      iso,
      name: names.of(iso) ?? iso,
      dialCode: getCountryCallingCode(iso),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
  return cachedCountries;
}

/** Returns the number in E.164 format (e.g. "+6281234567890"), or null if invalid. */
export function toValidE164(country: CountryCode, nationalNumber: string): string | null {
  const digits = nationalNumber.replace(/[^\d]/g, "");
  if (!digits) return null;
  const parsed = parsePhoneNumberFromString(`+${getCountryCallingCode(country)}${digits}`);
  return parsed?.isValid() ? parsed.number : null;
}

/** Server-side check for a full international number that must start with "+". */
export function normalizeInternationalPhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) return null;
  const parsed = parsePhoneNumberFromString(trimmed);
  return parsed?.isValid() ? parsed.number : null;
}
