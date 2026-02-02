// Backend API client for fetching markets
const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
const API_BASE_URL = isDev
    ? 'http://localhost:3000'
    : 'https://blockseer.onrender.com';

// API response types matching backend format
export interface ApiMarket {
  market_id: string;
  title: string;
  description: string;
  status: 'pending' | 'locked' | 'resolved';
  deadline: string;
  threshold: string;
  metric_type: string;
  total_staked: string;
  option_a_stakes: string;
  option_b_stakes: string;
  option_a_label: string;
  option_b_label: string;
}

// Fetch all markets
export async function fetchAllMarkets(): Promise<ApiMarket[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/markets`);
    if (!response.ok) {
      throw new Error(`Failed to fetch markets: ${response.statusText}`);
    }
    const data = await response.json();
    return data.markets || data || [];
  } catch (error) {
    console.error('Error fetching all markets:', error);
    return [];
  }
}

// Fetch pending markets only
export async function fetchPendingMarkets(): Promise<ApiMarket[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/markets/pending`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pending markets: ${response.statusText}`);
    }
    const data = await response.json();
    return data.markets || data || [];
  } catch (error) {
    console.error('Error fetching pending markets:', error);
    return [];
  }
}

// Fetch locked markets only
export async function fetchLockedMarkets(): Promise<ApiMarket[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/markets/locked`);
    if (!response.ok) {
      throw new Error(`Failed to fetch locked markets: ${response.statusText}`);
    }
    const data = await response.json();
    return data.markets || data || [];
  } catch (error) {
    console.error('Error fetching locked markets:', error);
    return [];
  }
}
