import { Metric } from "./base.js";
import { ETHStakingRateMetric } from "./eth_staking.js";
import { ETHPriceMetric } from "./eth_price.js";
import { BTCPriceMetric } from "./btc_price.js";
import { BTCDominanceMetric } from "./btc_dominance.js";
import { ETHGasPriceMetric } from "./eth_gas_price.js";
import { FearGreedMetric } from "./fear_greed.js";
import { StablecoinPegMetric } from "./stablecoin_peg.js";
import { GenericMetric } from "./generic.js";

class MetricRegistry {
    private metrics: Map<string, Metric> = new Map();

    constructor() {
        this.register(new ETHStakingRateMetric());
        this.register(new ETHPriceMetric());
        this.register(new BTCPriceMetric());
        this.register(new BTCDominanceMetric());
        this.register(new ETHGasPriceMetric());
        this.register(new FearGreedMetric());
        this.register(new StablecoinPegMetric());
        this.register(new GenericMetric());
    }

    register(metric: Metric): void {
        this.metrics.set(metric.name, metric);
        console.log(`✅ Registered metric: ${metric.name}`);
    }

    getMetric(name: string): Metric | undefined {
        return this.metrics.get(name);
    }

    listMetrics(): string[] {
        return Array.from(this.metrics.keys());
    }
}

export const registry = new MetricRegistry();
