import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

interface RealtimeTableConfig {
  table: string;
  queryKeys: readonly unknown[][];
}

export function useRealtimeInvalidation(
  channelName: string,
  tables: RealtimeTableConfig[],
  enabled = true,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || tables.length === 0) {
      return undefined;
    }

    const channel = supabase.channel(channelName);

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table.table,
        },
        () => {
          table.queryKeys.forEach((queryKey) => {
            void queryClient.invalidateQueries({ queryKey });
          });
        },
      );
    });

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, enabled, queryClient, JSON.stringify(tables)]);
}
