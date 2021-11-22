export { Dictionary };
declare class Dictionary {
    #private;
    addTranslation(locale: string, category: string, key: string, translation: string | ((params: Record<string, any>) => string)): void;
    translate(locale: string, category: string, key: string, params?: Record<string, any>): string | null;
}
