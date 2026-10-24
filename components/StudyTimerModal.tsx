"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Flag,
  CheckCircle,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  BookOpen,
  Coffee,
  Check,
} from "lucide-react";
import { getIndianDateStr } from "@odisha-rank/shared";

interface StudyTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionSaved?: (minutes: number, notes: string) => void;
  activeCourseName?: string;
}

// Synthesize pleasant chime using Web Audio API (Zero external assets needed)
function playChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Bright chord)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.8);
    });
  } catch (e) {
    console.warn("Audio chime unsupported:", e);
  }
}

export const StudyTimerModal: React.FC<StudyTimerModalProps> = ({
  isOpen,
  onClose,
  onSessionSaved,
  activeCourseName = "OSSC Combined Graduate Level",
}) => {
  const [mode, setMode] = useState<"stopwatch" | "pomodoro">("stopwatch");
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Pomodoro settings
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroRemaining, setPomodoroRemaining] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);

  // Laps
  const [laps, setLaps] = useState<number[]>([]);

  // Sound enabled
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Save session state
  const [isSaving, setIsSaving] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Tick logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (mode === "stopwatch") {
          setElapsedSeconds((prev) => prev + 1);
        } else {
          setPomodoroRemaining((prev) => {
            if (prev <= 1) {
              // Timer finished!
              if (soundEnabled) playChime();
              setIsRunning(false);
              if (!isBreak) {
                // Switch to break
                setIsBreak(true);
                return 5 * 60;
              } else {
                // Break ended, back to focus
                setIsBreak(false);
                return pomodoroMinutes * 60;
              }
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, isBreak, pomodoroMinutes, soundEnabled]);

  if (!isOpen) return null;

  // Format time display
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (mode === "stopwatch") {
      setElapsedSeconds(0);
      setLaps([]);
    } else {
      setIsBreak(false);
      setPomodoroRemaining(pomodoroMinutes * 60);
    }
  };

  const handleAddLap = () => {
    if (mode === "stopwatch" && elapsedSeconds > 0) {
      setLaps([elapsedSeconds, ...laps]);
    }
  };

  const handleSwitchPomodoroDuration = (mins: number) => {
    setPomodoroMinutes(mins);
    setIsRunning(false);
    setIsBreak(false);
    setPomodoroRemaining(mins * 60);
  };

  const handleSaveSession = async () => {
    const studySeconds =
      mode === "stopwatch"
        ? elapsedSeconds
        : pomodoroMinutes * 60 - pomodoroRemaining;

    const studyMins = Math.max(1, Math.round(studySeconds / 60));
    setIsSaving(true);

    try {
      const res = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_minutes: studyMins,
          notes:
            sessionNotes.trim() ||
            `${mode === "stopwatch" ? "Stopwatch" : "Pomodoro"} study session (${activeCourseName})`,
          session_date: getIndianDateStr(),
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        if (soundEnabled) playChime();

        if (onSessionSaved) {
          onSessionSaved(studyMins, sessionNotes);
        }

        window.dispatchEvent(
          new CustomEvent("study-session-logged", {
            detail: { minutes: studyMins, notes: sessionNotes },
          })
        );

        setTimeout(() => {
          setSavedSuccess(false);
          setIsRunning(false);
          setElapsedSeconds(0);
          setPomodoroRemaining(pomodoroMinutes * 60);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to log study session:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Pomodoro progress percentage for circular ring
  const totalPomodoroSecs = isBreak ? 5 * 60 : pomodoroMinutes * 60;
  const pomodoroProgress = Math.min(
    100,
    Math.max(0, ((totalPomodoroSecs - pomodoroRemaining) / totalPomodoroSecs) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 flex flex-col ${
          isFullscreen ? "fixed inset-4 w-auto h-auto" : "w-full max-w-lg"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Study Stopwatch & Focus Timer</h2>
              <p className="text-[11px] text-slate-500">{activeCourseName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute sound" : "Enable sound"}
              className={`p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
                soundEnabled ? "text-blue-600" : ""
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => {
                setMode("stopwatch");
                setIsRunning(false);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-all ${
                mode === "stopwatch"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Stopwatch</span>
            </button>
            <button
              onClick={() => {
                setMode("pomodoro");
                setIsRunning(false);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-all ${
                mode === "pomodoro"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Pomodoro Focus</span>
            </button>
          </div>
        </div>

        {/* Timer Core Body */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center">
          {mode === "pomodoro" && (
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => handleSwitchPomodoroDuration(25)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  pomodoroMinutes === 25 && !isBreak
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                25 min Focus
              </button>
              <button
                onClick={() => handleSwitchPomodoroDuration(50)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  pomodoroMinutes === 50 && !isBreak
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                50 min Deep Work
              </button>
              <button
                onClick={() => {
                  setIsBreak(true);
                  setIsRunning(false);
                  setPomodoroRemaining(5 * 60);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isBreak
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                5 min Break
              </button>
            </div>
          )}

          {/* Big Time Display */}
          <div className="relative flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 my-2">
            {/* Circular Ring SVG */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-100"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`transition-all duration-500 ease-linear ${
                  mode === "pomodoro"
                    ? isBreak
                      ? "stroke-emerald-500"
                      : "stroke-blue-600"
                    : isRunning
                    ? "stroke-blue-600"
                    : "stroke-slate-300"
                }`}
                strokeWidth="6"
                strokeDasharray="276.46"
                strokeDashoffset={
                  mode === "pomodoro"
                    ? 276.46 - (276.46 * pomodoroProgress) / 100
                    : isRunning
                    ? 0
                    : 180
                }
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-mono">
                {mode === "stopwatch"
                  ? formatTime(elapsedSeconds)
                  : formatTime(pomodoroRemaining)}
              </span>
              <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                {mode === "stopwatch"
                  ? isRunning
                    ? "Recording Study Time"
                    : "Paused"
                  : isBreak
                  ? "Rest & Refresh"
                  : isRunning
                  ? "Focus Session Active"
                  : "Ready to Focus"}
              </span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={handleReset}
              title="Reset"
              className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleTogglePlay}
              className={`px-8 py-3.5 rounded-2xl font-bold text-sm text-white shadow-lg transition-all flex items-center gap-2 ${
                isRunning
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start</span>
                </>
              )}
            </button>

            {mode === "stopwatch" && (
              <button
                onClick={handleAddLap}
                disabled={!isRunning || elapsedSeconds === 0}
                title="Lap"
                className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-40 transition-colors"
              >
                <Flag className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Laps List (if any) */}
          {mode === "stopwatch" && laps.length > 0 && (
            <div className="w-full mt-4 max-h-24 overflow-y-auto space-y-1 pr-1">
              {laps.map((lap, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 px-3 bg-slate-50 rounded-lg text-slate-600 font-mono"
                >
                  <span className="font-sans text-slate-400">Lap {laps.length - idx}</span>
                  <span className="font-bold text-slate-800">{formatTime(lap)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Log as Study Session Box */}
          {((mode === "stopwatch" && elapsedSeconds >= 10) ||
            (mode === "pomodoro" && pomodoroRemaining < pomodoroMinutes * 60)) && (
            <div className="w-full mt-6 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>Save this time to your Dashboard Study Hours</span>
                <span className="text-blue-600 font-bold">
                  {Math.max(
                    1,
                    Math.round(
                      (mode === "stopwatch"
                        ? elapsedSeconds
                        : pomodoroMinutes * 60 - pomodoroRemaining) / 60
                    )
                  )}{" "}
                  min
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Optional notes (e.g. Revised Odisha History)"
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={handleSaveSession}
                  disabled={isSaving || savedSuccess}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Logged!</span>
                    </>
                  ) : isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Log Session</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
