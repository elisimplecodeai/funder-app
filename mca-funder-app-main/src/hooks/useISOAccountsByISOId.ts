import { useState, useEffect } from 'react';
import { getISOAccountsByISOId } from '@/lib/api/isoAccount';
import { ISOAccount } from '@/types/iso';

export function useISOAccountsByISOId(isoId?: string) {
  const [accounts, setAccounts] = useState<ISOAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    
    if (!isoId) {
      setAccounts([]);
      return;
    }

    setLoading(true);
    setError('');
    
    getISOAccountsByISOId(isoId)
      .then(res => {
        setAccounts(res.data.docs);
      })
      .catch(err => {
        console.error('Error in useISOAccountsByISOId:', err);
        setError(err.message || 'Failed to fetch accounts');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isoId]);

  return { accounts, loading, error };
} 