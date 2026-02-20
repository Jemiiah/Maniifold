'use client';

import { useQuery } from '@tanstack/react-query';
import { Market, MarketCategory } from '@/types';
import { fetchAllMarkets, ApiMarket } from '@/lib/api-client';
import { getPool, AleoPool } from '@/lib/aleo-client';
import { calculateOdds } from '@/lib/utils';

// Convert API market to Market type, optionally enriched with on-chain data
function apiMarketToMarket(market: ApiMarket, onChain?: AleoPool | null): Market {
  // Use on-chain stakes if available, otherwise fall back to API data
  const optionAStakes = onChain ? onChain.option_a_stakes : parseInt(market.option_a_stakes || '0', 10);
  const optionBStakes = onChain ? onChain.option_b_stakes : parseInt(market.option_b_stakes || '0', 10);

  const { yesPrice, noPrice } = calculateOdds(optionAStakes, optionBStakes);

  // Trader count from on-chain if available
  const traders = onChain ? onChain.total_no_of_stakes : 0;

  // Determine status based on API status
  let status: 'live' | 'upcoming' | 'resolved' = 'live';
  if (market.status === 'pending') {
    status = 'live';
  } else if (market.status === 'locked') {
    status = 'upcoming';
  } else if (market.status === 'resolved') {
    status = 'resolved';
  }

  // Convert deadline to readable date (deadline is Unix timestamp as string)
  const deadlineTimestamp = parseInt(market.deadline || '0', 10);
  const deadline = deadlineTimestamp ? new Date(deadlineTimestamp * 1000) : new Date();
  const endDate = deadline.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Use on-chain total_staked if available, otherwise API value
  const totalStaked = onChain ? onChain.total_staked : parseInt(market.total_staked || '0', 10);
  const volumeInAleo = totalStaked / 1_000_000;
  const volume = volumeInAleo >= 1000
    ? `${(volumeInAleo / 1000).toFixed(1)}K ALEO`
    : `${volumeInAleo.toFixed(2)} ALEO`;

  const subtitle = `${market.option_a_label} vs ${market.option_b_label}`;

  return {
    id: market.market_id,
    title: market.title || `Market`,
    subtitle: subtitle,
    category: 'DeFi' as MarketCategory,
    endDate,
    volume,
    traders,
    yesPrice,
    noPrice,
    change: 0,
    status,
    description: market.description || `A prediction market on BlockSeer.`,
    resolution: `This market resolves based on the ${market.metric_type} oracle. Threshold: ${market.threshold}`,
    history: [yesPrice, yesPrice, yesPrice, yesPrice, yesPrice, yesPrice, yesPrice, yesPrice, yesPrice, yesPrice],
  };
}

export function useAleoPools() {
  const { data: pools = [], isLoading, error, refetch } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const allMarkets = await fetchAllMarkets();

      // Try to enrich each market with on-chain data
      const enriched = await Promise.all(
        allMarkets.map(async (market) => {
          try {
            const onChainPool = await getPool(market.market_id);
            return apiMarketToMarket(market, onChainPool);
          } catch {
            // Fall back to API-only data if on-chain fetch fails
            return apiMarketToMarket(market);
          }
        })
      );

      return enriched;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    pools,
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch markets') : null,
    refetch,
  };
}
