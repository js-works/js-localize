import {
  formatDate,
  formatNumber,
  formatRelativeTime,
  getCalendarWeek,
  getFirstDayOfWeek,
  getLocaleInfo,
  getWeekendDays,
  parseDate,
  parseNumber
} from './internal/utils'

// === exports =======================================================

export {
  // -- functions ---
  addToDict,
  customize,
  defineTerms,
  localize,
  // --- types ---
  Category,
  DateFormat,
  DayNameFormat,
  FullTranslations,
  Locale,
  Localizer,
  Localization,
  MonthNameFormat,
  NumberFormat,
  RelativeTimeFormat,
  RelativeTimeUnit,
  Translations,
  TermKey,
  Terms,
  TermsOf
}

// === constants =====================================================

const defaultLocale = 'en-US'
const regexCategory = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/
const regexTermKey = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/
const seperator = '[<->]'

// === local data ====================================================

const dict = new Map<string, string | Function>()

// === public types ==================================================

declare global {
  namespace Localize {
    interface TranslationsMap {
      //'jsCockpit.test': TermsOf<typeof translations>
    }
  }
}

type Locale = string
type Category = `${string}.${string}`
type TermKey = string

type Terms<
  T extends Record<
    TermKey,
    string | ((params: Record<string, any>, localizer: Localizer) => string)
  > = any
> = T

type Translations = PartialTranslations<{
  [L: Locale]: {
    [C in keyof TranslationsMap]?: Partial<TranslationsMap[C]>
  }
}>

type FullTranslations<B extends string = ''> = {
  [L: Locale]: {
    [C in keyof TranslationsMap]: C extends Category
      ? C extends (B extends '' ? C : B | `${B}.${string}`)
        ? TranslationsMap[C] extends Terms
          ? TranslationsMap[C]
          : never
        : never
      : never
  }
}

type TermsOf<A> = A extends Record<Locale, Record<infer C, infer T>>
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
    locale: Locale,
    category: C & Category,
    termKey: K & TermKey,
    params?: FirstArg<TranslationsMap[C][K]>
  ): string | null

  parseNumber(locale: Locale, numberString: string): number | null
  parseDate(locale: Locale, dateString: string): Date | null
  formatNumber(locale: Locale, value: number, format?: NumberFormat): string
  formatDate(locale: Locale, value: Date, format?: DateFormat | null): string

  formatRelativeTime(
    locale: Locale,
    value: number,
    unit: RelativeTimeUnit,
    format?: RelativeTimeFormat
  ): string

  getFirstDayOfWeek(locale: Locale): number // 0 to 6, 0 means Sunday
  getCalendarWeek(locale: Locale, date: Date): number // 1 to 53
  getWeekendDays(locale: Locale): Readonly<number[]> // array of integers between 0 and 6
}

interface Localizer {
  getLocale(): string

  translate<
    C extends keyof TranslationsMap,
    K extends keyof TranslationsMap[C]
  >(
    category: C & Category,
    termKey: K & TermKey,
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
}

interface NumberFormat extends Intl.NumberFormatOptions {}
interface DateFormat extends Intl.DateTimeFormatOptions {}
type RelativeTimeFormat = Intl.RelativeTimeFormatOptions
type RelativeTimeUnit = Intl.RelativeTimeFormatUnit
type DayNameFormat = 'long' | 'short' | 'narrow'
type MonthNameFormat = 'long' | 'short' | 'narrow'

// === local types ===================================================

type TranslationsMap = Localize.TranslationsMap
type FirstArg<T> = T extends (arg1: infer A, ...rest: any[]) => any ? A : never

type PartialTranslations<
  T extends Record<Locale, Record<Category, Record<string, any>>>
> = {
  [L in keyof T]?: {
    [C in keyof T[L]]?: Partial<T[L][C]>
  }
}

// === defineTerms ===================================================

function defineTerms<T>(
  translations: T & Record<Locale, Record<Category, Terms>>
): T {
  return translations
}

// === addToDict =====================================================

function addToDict(...severalTranslations: Translations[]) {
  for (const translations of severalTranslations) {
    for (const [locale, data] of Object.entries(translations)) {
      for (const [category, terms] of Object.entries(data as any)) {
        if (!regexCategory.test(category)) {
          throw new TypeError(
            `Illegal category name "${category}" for localization`
          )
        }

        for (const [termKey, value] of Object.entries(terms as any)) {
          if (!regexTermKey.test(termKey)) {
            throw new TypeError(
              `Illegal term key name "${termKey}" for localization`
            )
          }

          const key = `${locale}${seperator}${category}${seperator}${termKey}`
          //console.log('addToDict:', key)
          dict.set(key, value as any)
        }
      }
    }
  }
}

// === customize =====================================================

function customize(
  mapper: (
    self: Localization,
    base: Localization,
    defaultLocale: string
  ) => Partial<Localization>
): Localization {
  const self = { ...baseLocalization }

  return Object.assign(self, mapper(self, baseLocalization, defaultLocale))
}

// === localize ======================================================

const localize = (() => {
  // for two different performance optimizations
  const cachedLocalizers = new Map<Locale, WeakMap<Localization, Localizer>>()
  let latestLocale: Locale | undefined
  let latestLocalization: Localization | undefined
  let latestLocalizer: Localizer | undefined

  return (
    localeOrGetLocale: Locale | null | (() => Locale | null),
    localizationOrGetLocalization?:
      | Localization
      | null
      | (() => Localization | null)
  ): Localizer => {
    const _locale =
      typeof localeOrGetLocale !== 'function'
        ? (localeOrGetLocale as Locale)
        : null

    const _localization =
      typeof localizationOrGetLocalization !== 'function'
        ? (localizationOrGetLocalization as Localization)
        : null

    if (_locale && _localization) {
      // first performance optimization (maybe premature optimization)
      if (_locale === latestLocale && _localization === latestLocalization) {
        return latestLocalizer!
      }

      // second performance optimization
      let localizer: Localizer | undefined
      let weakMap = cachedLocalizers.get(_locale)

      if (weakMap) {
        localizer = weakMap.get(_localization)
      } else {
        weakMap = new WeakMap()
        cachedLocalizers.set(_locale, weakMap)
      }

      if (!localizer) {
        localizer = createLocalizer(
          () => _locale,
          () => _localization
        )

        weakMap.set(_localization, localizer)
      }

      // for first performance optimization
      latestLocale = _locale
      latestLocalization = _localization
      latestLocalizer = localizer

      return localizer
    }

    const _getLocale =
      typeof localeOrGetLocale === 'function' ? localeOrGetLocale : null

    const _getLocalization =
      typeof localizationOrGetLocalization === 'function'
        ? localizationOrGetLocalization
        : null

    const getLocale = _getLocale
      ? () => _getLocale() || defaultLocale
      : () => _locale || defaultLocale

    const getLocalization = _getLocalization
      ? () => _getLocalization() || defaultLocalization
      : () => _localization || defaultLocalization

    return createLocalizer(getLocale, getLocalization)
  }
})()

// === local functions ===============================================

const baseLocalization: Localization = {
  translate(locale, category, termKey, params?): string | null {
    const key = `${category}${seperator}${termKey}`
    const { baseName, language } = getLocaleInfo(locale)

    let ret = dict.get(`${locale}${seperator}${key}`) || null

    if (ret === null && locale) {
      if (baseName !== locale) {
        ret = dict.get(`${baseName}${seperator}${key}`) || null
      }

      if (ret === null) {
        if (language !== baseName) {
          ret = dict.get(`${language}${seperator}${key}`) || null
        }
      }
    }

    if (ret !== null && params) {
      if (typeof ret !== 'function') {
        console.log(ret) // TODO

        throw new Error(
          `Invalid translation parameters for "${key}" in locale "${locale}"`
        )
      }

      ret = String(ret(params, localize(locale, baseLocalization)))
    }

    return ret === null ? ret : String(ret)
  },

  formatNumber,
  formatDate,
  parseNumber,
  parseDate,
  formatRelativeTime,
  getFirstDayOfWeek,
  getCalendarWeek,
  getWeekendDays
}

const defaultLocalization = customize((self, base) => ({
  translate(locale, category, termKey, replacements?) {
    let translation = base.translate(locale, category, termKey, replacements)

    if (translation === null && defaultLocale !== locale) {
      translation = base.translate(
        defaultLocale,
        category,
        termKey,
        replacements
      )
    }

    return translation
  }
}))

function createLocalizer(
  getLocale: () => Locale,
  getLocalization: () => Localization
): Localizer {
  Intl
  const localizer: Localizer = {
    getLocale,

    translate: (category, termKey, replacements?) =>
      getLocalization().translate(
        getLocale(),
        category,
        termKey,
        replacements
      ) || '',

    parseNumber: (numberString) =>
      getLocalization().parseNumber(getLocale(), numberString),

    parseDate: (dateString) =>
      getLocalization().parseDate(getLocale(), dateString),

    formatNumber: (number, format) =>
      getLocalization().formatNumber(getLocale(), number, format),

    formatDate: (date, format) =>
      getLocalization().formatDate(getLocale(), date, format),

    formatRelativeTime: (number, unit, format) =>
      getLocalization().formatRelativeTime(getLocale(), number, unit, format),

    getFirstDayOfWeek: () => getLocalization().getFirstDayOfWeek(getLocale()),
    getWeekendDays: () => getLocalization().getWeekendDays(getLocale()),

    getCalendarWeek: (date: Date) =>
      getLocalization().getCalendarWeek(getLocale(), date),

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

/*
const x = defineTerms({
  en: {
    'jsCockpit.paginationBar': {
      itemsXToYOfZ(
        params: {
          firstItemNo: number
          lastItemNo: number
          itemCount: number
        },
        i18n: Localizer
      ) {
        const firstItemNo = i18n.formatNumber(params.firstItemNo)
        const lastItemNo = i18n.formatNumber(params.lastItemNo)
        const itemCount = i18n.formatNumber(params.itemCount)

        return `${firstItemNo} - ${lastItemNo} / ${itemCount}`
      },

      itemXOfY(i18n: Localizer, params: { itemNo: number; itemCount: number }) {
        const itemNo = i18n.formatNumber(params.itemNo)
        const itemCount = i18n.formatNumber(params.itemCount)

        return `${itemNo} - ${itemCount}`
      }
    }
  }
})
*/
/*
const translations = defineTerms({
  de: {
    'jsCockpit.test': {
      term1: 'ttttt',
      term2: (params: { param1: string; param2: number }) => {
        return ''
      }
    }
  }
})
*/
