export interface Metric {
    name: string;
    fetchValue(): Promise<number | null>;
}
