import { createI18n } from "vue-i18n";
import { messages } from "./messages";

export type SupportedLocale = keyof typeof messages;

export const defaultLocale: SupportedLocale = "zh-CN";
export const supportedLocales = Object.keys(messages) as SupportedLocale[];
export const localeLabelKeys = {
  "zh-CN": "language.locales.zhCn",
  "en-US": "language.locales.enUs",
} satisfies Record<SupportedLocale, string>;

const localeStorageKey = "cc-particle-editor-locale";

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return Boolean(value && supportedLocales.includes(value as SupportedLocale));
}

function normalizeLocale(value: string | null | undefined): SupportedLocale | null {
  if (!value) return null;
  if (isSupportedLocale(value)) return value;

  const normalized = value.toLowerCase();
  if (normalized.startsWith("zh")) return "zh-CN";
  if (normalized.startsWith("en")) return "en-US";
  return null;
}

function storedLocale(): SupportedLocale | null {
  if (typeof window === "undefined") return null;

  try {
    return normalizeLocale(window.localStorage.getItem(localeStorageKey));
  } catch {
    return null;
  }
}

function browserLocale(): SupportedLocale | null {
  if (typeof navigator === "undefined") return null;

  for (const locale of navigator.languages || [navigator.language]) {
    const supportedLocale = normalizeLocale(locale);
    if (supportedLocale) return supportedLocale;
  }
  return null;
}

function resolveInitialLocale(): SupportedLocale {
  return storedLocale() || browserLocale() || defaultLocale;
}

function updateDocumentLocale(locale: SupportedLocale): void {
  if (typeof document === "undefined") return;

  document.documentElement.lang = locale;
  document.title = messages[locale].meta.title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", messages[locale].meta.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", messages[locale].meta.title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute("content", messages[locale].meta.description);
  document.querySelector<HTMLMetaElement>('meta[property="og:locale"]')?.setAttribute("content", locale === "zh-CN" ? "zh_CN" : "en_US");
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute("content", messages[locale].app.title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute("content", messages[locale].meta.description);
}

const initialLocale = resolveInitialLocale();

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: defaultLocale,
  messages,
});

export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale;
  updateDocumentLocale(locale);

  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(localeStorageKey, locale);
  } catch {
    // Ignore storage failures in privacy modes.
  }
}

updateDocumentLocale(initialLocale);
