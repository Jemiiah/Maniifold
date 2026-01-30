import requests
from .base import BaseMetric

class ETHPriceMetric(BaseMetric):
    @property
    def name(self) -> str:
        return "eth_price"

    def fetch_value(self) -> float:
        """
        Fetches current ETH price from CoinGecko.
        """
        try:
            print("📸 Taking snapshot of ETH price data...")
            url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
            resp = requests.get(url)
            data = resp.json()
            
            price = data.get("ethereum", {}).get("usd")
            if price is None:
                print(f"❌ CoinGecko Error: Invalid response format {data}")
                return None
            
            return float(price)
        except Exception as e:
            print(f"❌ Error fetching ETH price: {e}")
            return None
