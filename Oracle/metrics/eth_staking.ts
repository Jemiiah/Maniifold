import axios from "axios";
import { Metric } from "./base.js";
import { ETHERSCAN_API_KEY } from "../config.js";

export class ETHStakingRateMetric implements Metric {
    name = "eth_staking_rate";

    async fetchValue(): Promise<number | null> {
        if (!ETHERSCAN_API_KEY) {
            console.log("⚠️ ETHERSCAN_API_KEY not found in environment.");
            return null;
        }

        try {
            console.log("📸 Taking snapshot of ETH staking data...");

            // 1. Fetch Total Supply from Etherscan
            const supplyUrl = `https://api.etherscan.io/api?module=stats&action=ethsupply&apikey=${ETHERSCAN_API_KEY}`;
            const supplyResp = await axios.get(supplyUrl);
            const supplyData = supplyResp.data;

            if (supplyData.status !== "1") {
                console.log(`❌ Etherscan Error: ${supplyData.message}`);
                return null;
            }

            const totalSupply = parseInt(supplyData.result) / 10 ** 18;

            // 2. Fetch Total Staked from Beaconcha.in
            let stakedUrl = "https://beaconcha.in/api/v1/ethstore/latest";
            let stakedResp = await axios.get(stakedUrl);
            let stakedData = stakedResp.data;

            let totalStaked = 0;

            if (stakedData.status !== "OK") {
                stakedUrl = "https://beaconcha.in/api/v1/validator/statistics";
                stakedResp = await axios.get(stakedUrl);
                stakedData = stakedResp.data;

                if (stakedData.status !== "OK") {
                    console.log(`❌ Beaconcha.in Error: ${stakedData.message}`);
                    return null;
                }
                totalStaked = stakedData.data[0].active_validators_total * 32;
            } else {
                totalStaked = parseInt(stakedData.data.total_balance) / 10 ** 9;
            }

            const stakingRate = (totalStaked / totalSupply) * 100;
            return stakingRate;
        } catch (e: any) {
            console.log(`❌ Error fetching staking data: ${e.message}`);
            return null;
        }
    }
}
