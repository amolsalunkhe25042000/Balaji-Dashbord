"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

const PASSWORD_SUFFIX = "992125";
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000;

interface AccessState {
  failedAttempts: number;
  lockedUntil: number;
}

function accessStorageKey(date = new Date()) {
  return `balaji_crm_access_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function lockStorageKey(date = new Date()) {
  return `${accessStorageKey(date)}_lock`;
}

function dailyPassword(date = new Date()) {
  return `${String(date.getDate()).padStart(2, "0")}${PASSWORD_SUFFIX}`;
}

export default function ProtectedPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(accessStorageKey()) === "unlocked") setUnlocked(true);
      const stored = window.localStorage.getItem(lockStorageKey());
      if (stored) {
        const state = JSON.parse(stored) as AccessState;
        if (state.lockedUntil > Date.now()) {
          setFailedAttempts(state.failedAttempts);
          setLockedUntil(state.lockedUntil);
        } else {
          window.localStorage.removeItem(lockStorageKey());
        }
      }
    } catch {
      // Continue with the modal when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= lockedUntil) {
        setLockedUntil(0);
        setFailedAttempts(0);
        setError("");
        try {
          window.localStorage.removeItem(lockStorageKey());
        } catch {
          // Continue without persistence when browser storage is unavailable.
        }
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  function unlock(event: FormEvent) {
    event.preventDefault();
    if (lockedUntil > Date.now()) return;
    if (password === dailyPassword()) {
      setUnlocked(true);
      setFailedAttempts(0);
      try {
        window.sessionStorage.setItem(accessStorageKey(), "unlocked");
        window.localStorage.removeItem(lockStorageKey());
      } catch {
        // The current page remains unlocked even when storage is unavailable.
      }
      setPassword("");
      setError("");
      return;
    }
    const nextAttempts = failedAttempts + 1;
    if (nextAttempts >= MAX_ATTEMPTS) {
      const nextLockedUntil = Date.now() + LOCK_DURATION_MS;
      setFailedAttempts(MAX_ATTEMPTS);
      setLockedUntil(nextLockedUntil);
      setNow(Date.now());
      setError("Too many incorrect attempts. This page is locked for 30 minutes.");
      try {
        window.localStorage.setItem(lockStorageKey(), JSON.stringify({ failedAttempts: MAX_ATTEMPTS, lockedUntil: nextLockedUntil } satisfies AccessState));
      } catch {
        // Continue with the in-memory lock when browser storage is unavailable.
      }
    } else {
      setFailedAttempts(nextAttempts);
      setError(`Incorrect password. ${MAX_ATTEMPTS - nextAttempts} attempt${MAX_ATTEMPTS - nextAttempts === 1 ? "" : "s"} remaining.`);
      try {
        window.localStorage.setItem(lockStorageKey(), JSON.stringify({ failedAttempts: nextAttempts, lockedUntil: 0 } satisfies AccessState));
      } catch {
        // Continue with the in-memory attempt count when browser storage is unavailable.
      }
    }
    setPassword("");
  }

  const isLocked = lockedUntil > now;
  const remainingSeconds = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingLockSeconds = String(remainingSeconds % 60).padStart(2, "0");

  if (unlocked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[60] flex min-h-screen items-center justify-center bg-deep/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="protected-page-title">
        <div className="relative overflow-hidden bg-deep px-5 py-7 text-white sm:px-8 sm:py-9">
          <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full border-[22px] border-water/40" aria-hidden="true" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl" aria-hidden="true">⌁</div>
          <p className="relative mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#9FD3D2]">Owner access</p>
          <h1 id="protected-page-title" className="relative mt-2 font-display text-2xl font-bold">{title}</h1>
          <p className="relative mt-2 text-sm leading-relaxed text-[#D8ECEB]">{description}</p>
        </div>
        <form onSubmit={unlock} className="flex flex-col gap-4 p-5 sm:p-8">
          <div>
            <label className="field-label" htmlFor="owner-access-password">Enter password</label>
            <input id="owner-access-password" className="field-input" type="password" inputMode="numeric" autoFocus autoComplete="off" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Today's access code" aria-describedby={error ? "owner-access-error" : undefined} disabled={isLocked} required />
            {error && <p id="owner-access-error" className="mt-2 text-xs font-semibold text-red-700" role="alert">{error}</p>}
            {!isLocked && <p className="mt-2 text-xs text-muted">{MAX_ATTEMPTS - failedAttempts} attempt{MAX_ATTEMPTS - failedAttempts === 1 ? "" : "s"} remaining.</p>}
            {isLocked && <p className="mt-2 text-xs font-semibold text-red-700" role="status">Try again in {remainingMinutes}:{remainingLockSeconds}.</p>}
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isLocked}>{isLocked ? "Temporarily locked" : `Unlock ${title}`}</button>
        </form>
      </div>
    </div>
  );
}
