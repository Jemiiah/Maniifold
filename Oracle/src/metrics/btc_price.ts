import axios from "axios";
import { Metric } from "./base.js";

export class BTCPriceMetric implements Metric {
    name = "btc_price";

    async fetchValue(): Promise<number | null> {
        try {
            console.log("📸 Taking snapshot of BTC price data...");
            const url =
                "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
            const resp = await axios.get(url);
            const data = resp.data;

            const price = data.bitcoin?.usd;
            if (price === undefined) {
                console.log(`❌ CoinGecko Error: Invalid response format ${JSON.stringify(data)}`);
                return null;
            }

            return price;
        } catch (e: any) {
            console.log(`❌ Error fetching BTC price: ${e.message}`);
            return null;
        }
    }
}
