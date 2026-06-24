import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['en', 'pt', 'pt-BR', 'es', 'de', 'pl', 'uk', 'ru', 'ja', 'fr', 'zh', 'hi'] as const;
export type Locale = (typeof locales)[number];

import { fetchTranslations } from './lib/directus';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  // Load local messages - these are the primary source
  let messages = {};
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch {
    // Local messages not found for this locale
  }

  // Try to fetch remote messages from Directus (optional enhancement)
  try {
    const remoteMessages = await fetchTranslations(locale);
    // Merge remote messages with local (remote overrides local)
    if (Object.keys(remoteMessages).length > 0) {
      const deepMerge = (target: any, source: any): any => {
        if (!source || typeof source !== 'object') return target;
        if (!target || typeof target !== 'object') return source;

        const output = { ...target };

        Object.keys(source).forEach(key => {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (key in target && typeof target[key] === 'object') {
              output[key] = deepMerge(target[key], source[key]);
            } else {
              output[key] = source[key];
            }
          } else {
            output[key] = source[key];
          }
        });

        return output;
      };

      messages = deepMerge(messages, remoteMessages);
    }
  } catch {
    // Silently ignore Directus errors - local messages are sufficient
  }

  return {
    locale: locale as string,
    messages
  };
});
