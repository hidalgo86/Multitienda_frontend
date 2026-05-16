"use client";

import { useCallback, useEffect, useState } from "react";

export const useSubmitCooldown = (seconds: number) => {
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  const startCooldown = useCallback(() => {
    const nextCooldownUntil = Date.now() + seconds * 1000;
    setNow(Date.now());
    setCooldownUntil(nextCooldownUntil);
  }, [seconds]);

  const remainingSeconds = Math.max(
    0,
    Math.ceil((cooldownUntil - now) / 1000),
  );

  return {
    isCoolingDown: remainingSeconds > 0,
    remainingSeconds,
    startCooldown,
  };
};
