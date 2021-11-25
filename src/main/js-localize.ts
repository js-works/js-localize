import {
  formatDate,
  formatNumber,
  formatRelativeTime,
  getCalendarWeek,
  getFirstDayOfWeek,
  getWeekendDays,
  parseDate,
  parseNumber
} from './internal/utils'

import { Dict } from 'internal/dict'

// === exports =======================================================

export {
  // -- functions ---
  addToDict,
  initI18n,
  localize,
  // --- types ---
  Category,
  DateFormat,
  DayNameFormat,
  FullTranslations,
  Language,
  Localizer,
  Localization,
  MonthNameFormat,
  NumberFormat,
  RelativeTimeFormat,
  RelativeTimeUnit,
  Translations,
  Terms,
  TermsOf
}

// === public types ==================================================

declare global {
  namespace Localize {
    interface TranslationsMap {}
  }
}

type Category = `${string}.${string}`

type Terms<
  T extends Record<
    string,
    string | ((params: Record<string, any>) => string)
  > = any
> = T

type Translations = PartialTranslations<{
  [L: Language]: {
    [C in keyof TranslationsMap]?: Partial<TranslationsMap[C]>
  }
}>

type FullTranslations<B extends string = ''> = {
  [L: Language]: {
    [C in keyof TranslationsMap]: C extends Category
      ? C extends (B extends '' ? C : B | `${B}.${string}`)
        ? TranslationsMap[C] extends Terms
          ? TranslationsMap[C]
          : never
        : never
      : never
  }
}

type TermsOf<A> = A extends Record<Language, Record<infer C, infer T>>
  ? C extends Category
    ? T
    : never
  : A extends Category
  ? A extends keyof TranslationsMap
    ? TranslationsMap[A] extends Terms
      ? TranslationsMap[A]
      : never
    : never
  : never

interface Localization {
  translate<
    C extends keyof TranslationsMap,
    K extends keyof TranslationsMap[C]
  >(
    locale: string,
    category: C & Category,
    key: K & string,
    params?: FirstArg<TranslationsMap[C][K]>
  ): string | null

  parseNumber(locale: string, numberString: string): number | null
  parseDate(locale: string, dateString: string): Date | null

  formatNumber(locale: string, value: number, format?: NumberFormat): string
  formatDate(locale: string, value: Date, format?: DateFormat | null): string

  formatRelativeTime(
    locale: string,
    value: number,
    unit: RelativeTimeUnit,
    format?: RelativeTimeFormat
  ): string

  getFirstDayOfWeek(locale: string): number // 0 to 6, 0 means Sunday
  getCalendarWeek(locale: string, date: Date): number // 1 to 53
  getWeekendDays(locale: string): Readonly<number[]> // array of integers between 0 and 6
}

type Localizer = Readonly<{
  getLocale(): string

  translate<
    C extends keyof TranslationsMap,
    K extends keyof TranslationsMap[C]
  >(
    category: C & Category,
    key: K & string,
    params?: FirstArg<TranslationsMap[C][K]>
  ): string

  parseNumber(numberString: string): number | null
  parseDate(dateString: string): Date | null
  formatNumber(value: number, format?: NumberFormat): string
  formatDate(value: Date, format?: DateFormat | null): string

  formatRelativeTime(
    value: number,
    unit: RelativeTimeUnit,
    format?: RelativeTimeFormat
  ): string

  getFirstDayOfWeek(): number // 0 to 6, 0 means Sunday
  getWeekendDays(): Readonly<number[]> // array of integer form 0 to 6
  getCalendarWeek(date: Date): number // 1 to 53
  getDayName(index: number, format?: DayNameFormat): string
  getDayNames(format?: DayNameFormat): string[]
  getMonthName(index: number, format?: MonthNameFormat): string
  getMonthNames(format?: MonthNameFormat): string[]
}>

interface NumberFormat extends Intl.NumberFormatOptions {}
interface DateFormat extends Intl.DateTimeFormatOptions {}
type RelativeTimeFormat = Intl.RelativeTimeFormatOptions
type RelativeTimeUnit = Intl.RelativeTimeFormatUnit
type DayNameFormat = 'long' | 'short' | 'narrow'
type MonthNameFormat = 'long' | 'short' | 'narrow'

// === local types ===================================================

type Language = string
type TranslationsMap = Localize.TranslationsMap
type FirstArg<T> = T extends (arg: infer A) => any ? A : never

type PartialTranslations<
  T extends Record<Language, Record<Category, Record<string, any>>>
> = {
  [L in keyof T]?: {
    [C in keyof T[L]]?: Partial<T[L][C]>
  }
}

// === addToDict =====================================================

function addToDict(...severalTranslations: Translations[]) {
  for (const translations of severalTranslations) {
    for (const [language, data] of Object.entries(translations)) {
      for (const [category, terms] of Object.entries(data as any)) {
        for (const [key, value] of Object.entries(terms as any)) {
          dict.addTranslation(language, category, key, value as any)
        }
      }
    }
  }
}

// === initI18n ======================================================

function initI18n(params: {
  defaultLocale?: string

  customize?(
    self: Localization,
    base: Localization,
    defaultLocale: string
  ): Partial<Localization>
}): void {
  if (isFinal) {
    throw (
      'Illegal invocation of `initI18n(...)`' +
      '- must only be used at start of the app' +
      ' before any other localization function has been used'
    )
  }

  isFinal = true

  if (params.defaultLocale) {
    defaultLocale = params.defaultLocale
  }

  if (params.customize) {
    const self = { ...baseBehavior }

    behavior = Object.assign(
      self,
      params.customize(self, baseBehavior, defaultLocale)
    )
  }
}

// === localize ======================================================

function localize(
  localeOrGetLocale: string | null | (() => string | null)
): Localizer {
  const getLocale =
    typeof localeOrGetLocale === 'function'
      ? () => localeOrGetLocale() || defaultLocale
      : () => localeOrGetLocale || defaultLocale

  isFinal = true
  return createLocalizer(getLocale, behavior)
}

// === local data ====================================================

// singleton dictionary to store the translations
const dict = new Dict()

// flag that indicates whether an initial customizing
// of the localization behavior is still possible or not
let isFinal = false

// default locale is "en-US", but this can be customized
// by using the `initI18n` function
let defaultLocale = 'en-US'

// === local functions ===============================================

const baseBehavior: Localization = {
  translate: dict.translate.bind(dict) as any, // TODO
  formatNumber,
  formatDate,
  parseNumber,
  parseDate,
  formatRelativeTime,
  getFirstDayOfWeek,
  getCalendarWeek,
  getWeekendDays
}

let behavior: Localization = {
  ...baseBehavior,

  translate(locale, category, key, replacements?) {
    let translation = baseBehavior.translate(
      locale,
      category,
      key,
      replacements
    )

    if (translation === null && defaultLocale !== locale) {
      translation = baseBehavior.translate(
        defaultLocale,
        category,
        key,
        replacements
      )
    }

    return translation
  }
}

function createLocalizer(
  getLocale: () => string,
  i18n: Localization
): Localizer {
  const localizer: Localizer = {
    getLocale,

    translate: (category, key, replacements?) =>
      i18n.translate(getLocale(), category, key, replacements) || '',

    parseNumber: (numberString) => i18n.parseNumber(getLocale(), numberString),
    parseDate: (dateString) => i18n.parseDate(getLocale(), dateString),

    formatNumber: (number, format) =>
      i18n.formatNumber(getLocale(), number, format),

    formatDate: (date, format) => i18n.formatDate(getLocale(), date, format),

    formatRelativeTime: (number, unit, format) =>
      i18n.formatRelativeTime(getLocale(), number, unit, format),

    getFirstDayOfWeek: () => i18n.getFirstDayOfWeek(getLocale()),
    getWeekendDays: () => i18n.getWeekendDays(getLocale()),
    getCalendarWeek: (date: Date) => i18n.getCalendarWeek(getLocale(), date),

    getDayName(index, format = 'long') {
      const date = new Date(1970, 0, 4 + (index % 7))

      return new Intl.DateTimeFormat(getLocale(), { weekday: format }).format(
        date
      )
    },

    getDayNames(format = 'long') {
      const arr: string[] = []

      for (let i = 0; i < 7; ++i) {
        arr.push(localizer.getDayName(i, format))
      }

      return arr
    },

    getMonthName(index, format = 'long') {
      const date = new Date(1970, index % 12, 1)

      return new Intl.DateTimeFormat(getLocale(), { month: format }).format(
        date
      )
    },

    getMonthNames(format = 'long') {
      const arr: string[] = []

      for (let i = 0; i < 12; ++i) {
        arr.push(localizer.getMonthName(i, format))
      }

      return arr
    }
  }

  return localizer
}
