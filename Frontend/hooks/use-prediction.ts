'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { v4 as uuidv4 } from 'uuid';

// Program ID from the deployed Leo program
const PROGRAM_ID = 'predictionprivacyhackviii.aleo';

// Default pool ID (will be made dynamic later)
const DEFAULT_POOL_ID = '1field';

interface PredictionParams {
  poolId?: string;
  option: 1 | 2; // 1 for option A, 2 for option B
  amount: number; // Amount in microcredits
}

interface PredictionResult {
  transactionId: string | undefined;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

// Generate a random number for the prediction ID
function generateRandomNumber(): number {
  // Generate a random 64-bit unsigned integer (within safe JavaScript integer range)
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

// Convert a string to a field representation for Aleo
function stringToField(str: string): string {
  // If already formatted as a field, return as is
  if (str.endsWith('field')) {
    return str;
  }
  // For now, use numeric fields
  return `${str}field`;
}

export function usePrediction() {
  const { publicKey, requestTransaction, requestRecords } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const makePrediction = useCallback(
    async ({
      poolId = DEFAULT_POOL_ID,
      option,
      amount,
    }: PredictionParams): Promise<PredictionResult> => {
      if (!publicKey) {
        return {
          transactionId: undefined,
          status: 'error',
          error: 'Wallet not connected',
        };
      }

      if (!requestTransaction) {
        return {
          transactionId: undefined,
          status: 'error',
          error: 'Wallet does not support transactions',
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        // Generate random number for prediction ID
        const randomNumber = generateRandomNumber();

        // Format the pool ID as a field
        const formattedPoolId = poolId.endsWith('field') ? poolId : `${poolId}field`;

        // Convert amount to microcredits (1 Aleo = 1,000,000 microcredits)
        const amountInMicrocredits = amount * 1_000_000;

        // First, we need to get the user's credits record
        // The credits record is required for the predict function
        let creditsRecord: string | undefined;

        if (requestRecords) {
          try {
            // Fetch credits from our prediction program, not credits.aleo
            const records = await requestRecords(PROGRAM_ID);
            // Find a credits record with sufficient balance
            const suitableRecord = records?.find((record: string) => {
              try {
                const parsed = JSON.parse(record);
                // Check if this is a credits record (has microcredits field)
                if (!parsed.microcredits) return false;
                const balance = BigInt(parsed.microcredits.replace('u64.private', '').replace('u64', ''));
                return balance >= BigInt(amountInMicrocredits);
              } catch {
                return false;
              }
            });
            creditsRecord = suitableRecord;
          } catch (e) {
            console.warn('Could not fetch credits records from program:', e);
          }
        }

        // Build the inputs array for the predict function
        // predict(pool_id: field, option: u64, amount: u64, random_number: u64, user_credit: credits)
        const inputs = [
          formattedPoolId,           // pool_id: field
          `${option}u64`,            // option: u64 (1 or 2)
          `${amountInMicrocredits}u64`, // amount: u64 (in microcredits)
          `${randomNumber}u64`,      // random_number: u64
        ];

        // If we have a credits record, add it; otherwise the transaction will fail
        // The wallet may prompt the user to select a record
        if (creditsRecord) {
          inputs.push(creditsRecord);
        }

        // Create the transaction
        const aleoTransaction = Transaction.createTransaction(
          publicKey,
          WalletAdapterNetwork.TestnetBeta,
          PROGRAM_ID,
          'predict',
          inputs,
          100_000 // Fee in microcredits (0.1 Aleo)
        );

        // Request the transaction from the wallet
        const result = await requestTransaction(aleoTransaction);

        setTransactionId(result || null);
        setIsLoading(false);

        return {
          transactionId: result,
          status: 'success',
        };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Transaction failed';
        setError(errorMessage);
        setIsLoading(false);

        return {
          transactionId: undefined,
          status: 'error',
          error: errorMessage,
        };
      }
    },
    [publicKey, requestTransaction, requestRecords]
  );

  return {
    makePrediction,
    isLoading,
    error,
    transactionId,
    isConnected: !!publicKey,
    publicKey,
  };
}
