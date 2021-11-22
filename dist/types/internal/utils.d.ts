export { formatDate, formatNumber, formatRelativeTime, getCalendarWeek, getFirstDayOfWeek, getLocaleInfo, getWeekendDays, parseDate, parseNumber, };
declare type LocaleInfo = Readonly<{
    baseName: string;
    language: string;
    region: string | undefined;
}>;
declare function getLocaleInfo(locale: string): LocaleInfo;
declare function getFirstDayOfWeek(locale: string): number;
declare function getWeekendDays(locale: string): Readonly<number[]>;
declare function parseNumber(locale: string, numberString: string): number | null;
declare function parseDate(locale: string, dateString: string): Date | null;
declare function formatNumber(locale: string, value: number, format: Intl.NumberFormatOptions): string;
declare function formatDate(locale: string, value: Date, format?: Intl.DateTimeFormatOptions | null): string;
declare function getCalendarWeek(locale: string, date: Date): number;
declare function formatRelativeTime(locale: string, value: number, unit: Intl.RelativeTimeFormatUnit, format: Intl.RelativeTimeFormatOptions): string;
