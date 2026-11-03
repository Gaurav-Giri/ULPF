import { useState, useEffect, useCallback } from "react";
import { getHealth } from "../api/healthApi.js";

/**
 * Reusable hook for monitoring ULPF backend health.
 * Performs an initial check on mount and provides a manual refresh trigger.
 * Designed to avoid aggressively hammering the backend.
 */
export function useHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHealth();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialCheck() {
      setLoading(true);
      try {
        const result = await getHealth();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setLastChecked(new Date());
        }
      }
    }

    initialCheck();

    return () => {
      isMounted = false;
    };
  }, []);

  const isHealthy = Boolean(data && data.status === "ok");

  return {
    data,
    loading,
    error,
    isHealthy,
    lastChecked,
    refresh: checkHealth
  };
}

export default useHealth;
