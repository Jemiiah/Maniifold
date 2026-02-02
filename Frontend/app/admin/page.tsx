'use client';

import { useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { ArrowLeft, Plus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Admin address - only this wallet can create markets
const ADMIN_ADDRESS = 'aleo1jl3q3uywtdzlr8dln65xjc2mr7vwa2pm9fsenq49zsgsz5a8pqzs0j7cj5';

// Backend API URL
const API_BASE_URL = 'https://blockseer.onrender.com';

// Metric types available from your oracle
const METRIC_TYPES = [
  { value: 'eth_price', label: 'ETH Price', description: 'Ethereum price in USD' },
  { value: 'btc_price', label: 'BTC Price', description: 'Bitcoin price in USD' },
  { value: 'eth_gas_price', label: 'ETH Gas Price', description: 'Ethereum gas price in gwei' },
  { value: 'btc_dominance', label: 'BTC Dominance', description: 'BTC #1 market cap (1=yes, 0=no)' },
  { value: 'eth_staking_rate', label: 'ETH Staking Rate', description: 'Ethereum staking APR %' },
  { value: 'fear_greed', label: 'Fear & Greed Index', description: 'Crypto market sentiment (0-100)' },
  { value: 'stablecoin_peg', label: 'Stablecoin Peg', description: 'USDT/USDC peg status' },
  { value: 'generic', label: 'Generic (Manual)', description: 'Admin resolves manually' },
];

interface MarketForm {
  title: string;
  description: string;
  option_a_label: string;
  option_b_label: string;
  metric_type: string;
  threshold: string;
  deadline: string;
}

const initialForm: MarketForm = {
  title: '',
  description: '',
  option_a_label: 'YES',
  option_b_label: 'NO',
  metric_type: 'eth_price',
  threshold: '',
  deadline: '',
};

export default function AdminPage() {
  const { publicKey, connected } = useWallet();
  const [form, setForm] = useState<MarketForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const isAdmin = connected && publicKey === ADMIN_ADDRESS;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      // Convert deadline to Unix timestamp
      const deadlineTimestamp = Math.floor(new Date(form.deadline).getTime() / 1000);

      const payload = {
        title: form.title,
        description: form.description,
        option_a_label: form.option_a_label,
        option_b_label: form.option_b_label,
        metric_type: form.metric_type,
        threshold: form.threshold,
        deadline: deadlineTimestamp.toString(),
      };

      const response = await fetch(`${API_BASE_URL}/markets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create market: ${response.statusText}`);
      }

      const data = await response.json();
      setResult({ success: true, message: `Market created successfully! ID: ${data.market_id || 'Created'}` });
      setForm(initialForm);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create market'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not connected state
  if (!connected) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Wallet Not Connected</h1>
          <p className="text-zinc-400 mb-6">Connect your Leo Wallet to access the admin panel.</p>
          <Link href="/">
            <Button variant="outline">Go Back Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Not admin state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-zinc-400 mb-2">Only the admin wallet can create markets.</p>
          <p className="text-zinc-500 text-sm font-mono mb-6">
            Required: {ADMIN_ADDRESS.slice(0, 12)}...{ADMIN_ADDRESS.slice(-6)}
          </p>
          <Link href="/">
            <Button variant="outline">Go Back Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Markets
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Market</h1>
          <p className="text-zinc-400">Create a prediction market that will be resolved by the oracle.</p>
        </div>

        {/* Result Message */}
        {result && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            result.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={result.success ? 'text-emerald-400' : 'text-red-400'}>
              {result.message}
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Market Title *
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="ETH above $4,000?"
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Will Ethereum price exceed $4,000 USD at the deadline?"
              required
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Option Labels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Option A Label *
              </label>
              <input
                type="text"
                name="option_a_label"
                value={form.option_a_label}
                onChange={handleChange}
                placeholder="YES"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Option B Label *
              </label>
              <input
                type="text"
                name="option_b_label"
                value={form.option_b_label}
                onChange={handleChange}
                placeholder="NO"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Metric Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Oracle Metric Type *
            </label>
            <select
              name="metric_type"
              value={form.metric_type}
              onChange={handleChange}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {METRIC_TYPES.map(metric => (
                <option key={metric.value} value={metric.value}>
                  {metric.label} - {metric.description}
                </option>
              ))}
            </select>
          </div>

          {/* Threshold */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Threshold Value *
            </label>
            <input
              type="number"
              name="threshold"
              value={form.threshold}
              onChange={handleChange}
              placeholder="4000"
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="mt-1 text-sm text-zinc-500">
              If metric value ≥ threshold → Option A wins. Otherwise → Option B wins.
            </p>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Resolution Deadline *
            </label>
            <input
              type="datetime-local"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="mt-1 text-sm text-zinc-500">
              Market will be locked and resolved at this time.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Market...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Market
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Preview */}
        {form.title && (
          <div className="mt-10 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Preview</h3>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-white">{form.title}</h4>
              <p className="text-zinc-400">{form.description}</p>
              <div className="flex gap-4 mt-4">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm">
                  {form.option_a_label}
                </span>
                <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-sm">
                  {form.option_b_label}
                </span>
              </div>
              <p className="text-sm text-zinc-500 mt-2">
                Resolves via {METRIC_TYPES.find(m => m.value === form.metric_type)?.label}
                {form.threshold && ` (threshold: ${form.threshold})`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
