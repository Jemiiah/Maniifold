import os
import requests
from .base import BaseMetric

class ETHStakingRateMetric(BaseMetric):
    @property
    def name(self) -> str:
        return "eth_staking_rate"

    def fetch_value(self) -> float:
        """
        Fetches ETH staking rate (total_staked / total_supply).
        """
        etherscan_api_key = os.getenv("ETHERSCAN_API_KEY")
        if not etherscan_api_key:
            print("⚠️ ETHERSCAN_API_KEY not found in environment.")
            return None

        try:
            print("📸 Taking snapshot of ETH staking data...")

            # 1. Fetch Total Supply from Etherscan
            supply_url = f"https://api.etherscan.io/api?module=stats&action=ethsupply&apikey={etherscan_api_key}"
            supply_resp = requests.get(supply_url)
            supply_data = supply_resp.json()
            
            if supply_data.get("status") != "1":
                print(f"❌ Etherscan Error: {supply_data.get('message')}")
                return None
                
            total_supply = int(supply_data["result"]) / 10**18
            
            # 2. Fetch Total Staked from Beaconcha.in
            staked_url = "https://beaconcha.in/api/v1/ethstore/latest"
            staked_resp = requests.get(staked_url)
            staked_data = staked_resp.json()
            
            if not staked_data.get("status") == "OK":
                staked_url = "https://beaconcha.in/api/v1/validator/statistics"
                staked_resp = requests.get(staked_url)
                staked_data = staked_resp.json()
                
                if not staked_data.get("status") == "OK":
                    print(f"❌ Beaconcha.in Error: {staked_data.get('message')}")
                    return None
                
                total_staked = staked_data["data"][0]["active_validators_total"] * 32
            else:
                total_staked = int(staked_data["data"]["total_balance"]) / 10**9

            staking_rate = (total_staked / total_supply) * 100
            return staking_rate
        except Exception as e:
            print(f"❌ Error fetching staking data: {e}")
            return None
