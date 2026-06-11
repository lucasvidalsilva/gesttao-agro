type RateLimitRecord = {
  timestamps: number[];
};

const cache = new Map<string, RateLimitRecord>();

export interface RateLimitConfig {
  intervalMs: number;
  maxRequests: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const windowStart = now - config.intervalMs;

  let record = cache.get(key);
  if (!record) {
    record = { timestamps: [] };
    cache.set(key, record);
  }

  // Filtrar timestamps que estão fora da janela de tempo atual
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= config.maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const resetTime = oldestTimestamp + config.intervalMs;
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset: resetTime,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.timestamps.length,
    reset: now + config.intervalMs,
  };
}

// Limpeza periódica (a cada 10 minutos) para evitar vazamento de memória em processos de longa duração
if (typeof globalThis !== "undefined") {
  const g = globalThis as any;
  if (!g.rateLimitCleanupInterval) {
    g.rateLimitCleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of cache.entries()) {
        // Se a última requisição foi há mais de 10 minutos, pode remover o registro
        if (
          record.timestamps.length === 0 ||
          now - record.timestamps[record.timestamps.length - 1] > 10 * 60 * 1000
        ) {
          cache.delete(key);
        }
      }
    }, 10 * 60 * 1000);
  }
}
