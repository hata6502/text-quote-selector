export type Index = [number, Text][];
export interface TextIndex {
    text: string;
    index: Index;
}
export interface TextQuoteSelector {
    exact: string;
    prefix?: string;
    suffix?: string;
}
export interface TextRange {
    start: TextRangePoint;
    end: TextRangePoint;
}
export interface TextRangePoint {
    textNode: Text;
    offset: number;
}
export declare const getTextIndex: (root: Node) => TextIndex;
export declare const getTextRange: (range: Range) => TextRange;
export declare const quoteText: (textIndex: TextIndex, range: Range) => TextQuoteSelector;
export declare const textQuoteSelectorAll: (textIndex: TextIndex, { exact, prefix, suffix }: TextQuoteSelector) => {
    range: Range;
    distance: number;
}[];
