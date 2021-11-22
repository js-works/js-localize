// === exports =======================================================

import { Dictionary } from 'internal/dict'

export {
  // -- functions ---
  addToDict,
  init,
  localize,
  check,
  // --- types ---
  Behavior,
  Category,
  Localizer,
  Terms,
  TermsOf,
  Translations,
  NumberFormat,
  DateFormat,
  RelativeTimeFormat,
  RelativeTimeUnit
}

// === public types ==================================================

declare global {
  namespace Localize {
    interface TranslationsMap {
      'jsCockpit.dialogs': {
        ok: string
        cancel: string
      }

      'jsCockpit.dataExplorer': {
        loadingMessage: string
      }
    }
  }
}

type Category = `${string}.${string}`

type Terms<
  T extends Record<
    string,
    string | ((params: Record<string, any>) => string)
  > = any
> = T

type Translations = Record<Lang, Record<Category, Terms>>

type CategoriesOf<A> = A extends Record<Lang, Record<infer C, Terms>>
  ? C extends Category
    ? C
    : never
  : never

type TermsOf<A> = A extends Record<Lang, Record<infer C, infer T>>
  ? C extends Category
    ? T
    : never
  : never

type Behavior = Readonly<{
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
}>

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
  getDayName(index: number, format?: 'long' | 'short' | 'narrow'): string
  getDayNames(format?: 'long' | 'short' | 'narrow'): string[]
  getMonthName(index: number, format?: 'long' | 'short' | 'narrow'): string
  getMonthNames(format?: 'long' | 'short' | 'narrow'): string[]
}>

interface NumberFormat extends Intl.NumberFormatOptions {}
interface DateFormat extends Intl.DateTimeFormatOptions {}
type RelativeTimeFormat = Intl.RelativeTimeFormatOptions
type RelativeTimeUnit = Intl.RelativeTimeFormatUnit

// === local types ===================================================

type Lang = string
type TranslationsMap = Localize.TranslationsMap
type FirstArg<T> = T extends (arg: infer A) => any ? A : never

type StartsWith<A extends string, B extends string> = A extends `${B}${string}`
  ? A
  : never

// === singleton dictionary ==========================================

const dict = new Dictionary()

// === addToDict =====================================================

function addToDict<
  C extends keyof TranslationsMap,
  T extends Record<Lang, Record<C, TranslationsMap[C]>>
>(translations: T) {
  for (const [language, data] of Object.entries(translations)) {
    for (const [category, terms] of Object.entries(data as any)) {
      for (const [key, value] of Object.entries(terms as any)) {
        dict.addTranslation(language, category, key, value as any)
      }
    }
  }
}

// === init ==========================================================

function init() {}

// === localize ======================================================

function localize() {
  console.log('woohoo')
}

// === check ==========================================================

function check<
  C extends keyof TranslationsMap,
  T extends Record<Lang, Record<C, TranslationsMap[C]>>
>(translations: T): T

function check<
  B extends string,
  C extends keyof TranslationsMap,
  T extends Record<Lang, Record<StartsWith<C, B>, TranslationsMap[C]>>
>(pattern: `${B}*`, translations: T): T

function check(arg1: any, arg2?: any) {
  return typeof arg1 === 'string' ? arg2 : arg1
}

const tr = {
  en: {
    'jsCockpit.dialogs': {
      ok: 'Okay',
      cancel: 'Cancel'
    },

    'jsCockpit.dataExplorer': {
      loadingMessage: 'xxx'
    }
  }
}

addToDict(tr)
