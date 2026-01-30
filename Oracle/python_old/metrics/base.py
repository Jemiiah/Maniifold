from abc import ABC, abstractmethod

class BaseMetric(ABC):
    """
    Abstract base class for all prediction market metrics.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique identifier for the metric (e.g., 'eth_staking_rate')."""
        pass

    @abstractmethod
    def fetch_value(self) -> float:
        """
        Fetches the current value of the metric from external data sources.
        Returns a float representing the snapshot value.
        """
        pass
