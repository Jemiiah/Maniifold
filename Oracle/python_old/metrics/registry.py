from .eth_staking import ETHStakingRateMetric
from .eth_price import ETHPriceMetric

class MetricRegistry:
    """
    Central registry for all metric handlers.
    """
    def __init__(self):
        self._metrics = {}
        # Register default metrics
        self.register(ETHStakingRateMetric())
        self.register(ETHPriceMetric())

    def register(self, metric):
        """Registers a new metric handler."""
        self._metrics[metric.name] = metric
        print(f"✅ Registered metric: {metric.name}")

    def get_metric(self, name):
        """Retrieves a metric handler by name."""
        return self._metrics.get(name)

    def list_metrics(self):
        """Returns a list of all registered metric names."""
        return list(self._metrics.keys())

# Global registry instance
registry = MetricRegistry()
