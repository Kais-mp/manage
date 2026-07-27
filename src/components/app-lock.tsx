"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getMachineAddress, getSavedActor, saveActor } from "@/lib/admin-activity";

const APP_LOCK_KEY = "laptrack-unlocked";
const APP_PASSWORD = "Usman1234";

export function AppLock() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [actorName, setActorName] = useState("");
  const [stage, setStage] = useState<'password' | 'actor'>('password');
  const [hasCheckedLock, setHasCheckedLock] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(APP_LOCK_KEY) : null;
    const savedActor = typeof window !== "undefined" ? getSavedActor() : null;

    setIsUnlocked(saved === "true" && Boolean(savedActor?.actor_name));
    if (savedActor?.actor_name) {
      setActorName(savedActor.actor_name);
    }
    setHasCheckedLock(true);
  }, []);

  const unlock = () => {
    if (stage === 'password') {
      if (password !== APP_PASSWORD) {
        toast.error("Incorrect password. Please try again.");
        return;
      }

      const savedActor = typeof window !== "undefined" ? getSavedActor() : null;
      if (savedActor?.actor_name) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(APP_LOCK_KEY, "true");
        }
        setIsUnlocked(true);
        toast.success("Welcome back to LapTrack");
        return;
      }

      setStage('actor');
      setPassword("");
      return;
    }

    const name = actorName.trim();
    if (name.length < 2) {
      toast.error("Please enter your name.");
      return;
    }

    const machineAddress = getMachineAddress();
    saveActor({ actor_name: name, machine_address: machineAddress });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(APP_LOCK_KEY, "true");
    }
    setIsUnlocked(true);
    toast.success(`Welcome, ${name}`);
  };

  if (!hasCheckedLock || isUnlocked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-[10px] px-4 py-6 text-slate-100">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-700 bg-slate-950/95 p-8 shadow-2xl shadow-slate-900/60">
        <div className="mb-6 flex items-center justify-center">
          <img
            src="/icon.png"
            alt="LapTrack Logo"
            className="h-20 w-20 rounded-3xl object-contain drop-shadow-lg"
          />
        </div>
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-semibold">LapTrack Locked</h1>
          <p className="text-sm text-slate-400">
            {stage === 'password'
              ? 'Enter the app password to continue.'
              : ' Provide your name below.'}
          </p>
        </div>
        <div className="mt-6 space-y-4">
          {stage === 'password' ? (
            <div>
              <label className="mb-2 block text-left text-sm font-medium text-slate-300" htmlFor="app-lock-password">
                Password
              </label>
              <Input
                id="app-lock-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    unlock();
                  }
                }}
              />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-left text-sm font-medium text-slate-300" htmlFor="app-lock-name">
                Your name
              </label>
              <Input
                id="app-lock-name"
                type="text"
                value={actorName}
                onChange={(event) => setActorName(event.target.value)}
                className="w-full"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    unlock();
                  }
                }}
              />
            </div>
          )}
          <Button className="w-full" onClick={unlock}>
            {stage === 'password' ? 'Unlock' : 'Continue'}
          </Button>
          {stage === 'password' ? (
            <p className="text-xs text-slate-500">
              Password is required to access the app.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
