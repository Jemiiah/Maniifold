import { Metric } from "./base.js";

/**
 * Generic metric for manual resolution.
 * This metric always returns null, meaning the market won't auto-resolve.
 * Admin must manually resolve these markets via CLI or API.
 */
export class GenericMetric implements Metric {
    name = "generic";

    async fetchValue(): Promise<number | null> {
        console.log("⚠️ Generic metric - requires manual resolution");
        return null;
    }
}
