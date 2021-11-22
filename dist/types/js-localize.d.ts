export { addToDict, init, localize, check, Localization as Behavior, Category, Localizer, Terms, TermsOf, Translations, NumberFormat, DateFormat, RelativeTimeFormat, RelativeTimeUnit };
declare global {
    namespace Localize {
        interface TranslationsMap {
        }
    }
}
declare type Category = `${string}.${string}`;
declare type Terms<T extends Record<string, string | ((params: Record<string, any>) => string)> = any> = T;
declare type Translations = Record<Lang, Record<Category, Terms>>;
declare type TermsOf<A> = A extends Record<Lang, Record<infer C, infer T>> ? C extends Category ? T : never : A extends Category ? A extends keyof TranslationsMap ? TranslationsMap[A] extends Terms ? TranslationsMap[A] : never : never : never;
declare type Localization = Readonly<{
    translate<C extends keyof TranslationsMap, K extends keyof TranslationsMap[C]>(locale: string, category: C & Category, key: K & string, params?: FirstArg<TranslationsMap[C][K]>): string | null;
    parseNumber(locale: string, numberString: string): number | null;
    parseDate(locale: string, dateString: string): Date | null;
    formatNumber(locale: string, value: number, format?: NumberFormat): string;
    formatDate(locale: string, value: Date, format?: DateFormat | null): string;
    formatRelativeTime(locale: string, value: number, unit: RelativeTimeUnit, format?: RelativeTimeFormat): string;
    getFirstDayOfWeek(locale: string): number;
    getCalendarWeek(locale: string, date: Date): number;
    getWeekendDays(locale: string): Readonly<number[]>;
}>;
declare type Localizer = Readonly<{
    getLocale(): string;
    translate<C extends keyof TranslationsMap, K extends keyof TranslationsMap[C]>(category: C & Category, key: K & string, params?: FirstArg<TranslationsMap[C][K]>): string;
    parseNumber(numberString: string): number | null;
    parseDate(dateString: string): Date | null;
    formatNumber(value: number, format?: NumberFormat): string;
    formatDate(value: Date, format?: DateFormat | null): string;
    formatRelativeTime(value: number, unit: RelativeTimeUnit, format?: RelativeTimeFormat): string;
    getFirstDayOfWeek(): number;
    getWeekendDays(): Readonly<number[]>;
    getCalendarWeek(date: Date): number;
    getDayName(index: number, format?: 'long' | 'short' | 'narrow'): string;
    getDayNames(format?: 'long' | 'short' | 'narrow'): string[];
    getMonthName(index: number, format?: 'long' | 'short' | 'narrow'): string;
    getMonthNames(format?: 'long' | 'short' | 'narrow'): string[];
}>;
interface NumberFormat extends Intl.NumberFormatOptions {
}
interface DateFormat extends Intl.DateTimeFormatOptions {
}
declare type RelativeTimeFormat = Intl.RelativeTimeFormatOptions;
declare type RelativeTimeUnit = Intl.RelativeTimeFormatUnit;
declare type Lang = string;
declare type TranslationsMap = Localize.TranslationsMap;
declare type FirstArg<T> = T extends (arg: infer A) => any ? A : never;
declare type StartsWith<A extends string, B extends string> = A extends `${B}${string}` ? A : never;
declare function addToDict<C extends keyof TranslationsMap, T extends Record<Lang, Partial<Record<C, TranslationsMap[C]>>>>(translations: T): void;
declare function init(params: {
    defaultLocale?: string;
    customize?(self: Localization, base: Localization, defaultLocale: string): Partial<Localization>;
}): void;
declare function localize(localeOrGetLocale: string | null | (() => string | null)): Localizer;
declare function check<C extends keyof TranslationsMap, T extends Record<Lang, Record<C, TranslationsMap[C]>>>(translations: T): T;
declare function check<B extends string, C extends keyof TranslationsMap, T extends Record<Lang, Record<StartsWith<C, B>, TranslationsMap[C]>>>(pattern: `${B}*`, translations: T): T;
