import { useState, useRef, useEffect } from "react";
import { Send, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useMap } from "../context/MapContext";

interface Message {
  id: string;
  text: string;
  sender: "ai" | "user";
  timestamp: Date;
}

const QUESTIONS = [
  { id: "noise", text: "HOW MUCH NOISE CAN YOU TOLERATE?", options: ["SILENCE (LIBRARY)", "BACKGROUND CHATTER", "LIVELY/LOUD"] },
  { id: "group_size", text: "ARE YOU FLYING SOLO OR BRINGING A CREW?", options: ["SOLO", "PAIR", "GROUP OF 3-4", "MASSIVE (5+)"] },
  { id: "time", text: "WHAT TIME ARE YOU GOING?", options: ["MORNING RUSH", "AFTERNOON CHILL", "EVENING BURN", "LATE NIGHT"] },
  { id: "outlets", text: "BATTERY STATUS CRITICAL?", options: ["MUST HAVE OUTLETS", "A FEW HOURS LEFT", "FULLY CHARGED"] },
  { id: "caffeine", text: "CAFFEINE REQUIREMENTS?", options: ["SPECIALTY COFFEE", "ANY CAFFEINE", "JUST A TABLE", "FOOD IS PRIORITY"] },
];

const API_BASE = "http://127.0.0.1:3000";

export function ChatBox() {
  const { triggerFetch } = useMap();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(true);
  // Accumulate answers: { noise: "SILENCE (LIBRARY)", group_size: "SOLO", ... }
  const answersRef = useRef<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionStartedRef = useRef(false);

  const addMessage = (text: string, sender: "ai" | "user") => {
    const msg: Message = { id: Date.now().toString() + Math.random(), text, sender, timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
  };

  useEffect(() => {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    setTimeout(() => {
      addMessage("INITIATING SPOT_SCOUT V2.0... THIRD_PLACE.EXE ONLINE.", "ai");
      setTimeout(() => askQuestion(0), 800);
    }, 500);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const askQuestion = (step: number) => {
    if (step >= QUESTIONS.length) {
      finishOnboarding();
      return;
    }
    const q = QUESTIONS[step];
    addMessage(q.text, "ai");
    setOptions(q.options);
  };

  const finishOnboarding = async () => {
    setIsOnboarding(false);
    setOptions([]);

    // Build a rich summary of all collected preferences
    const answers = answersRef.current;
    const summary = Object.entries(answers)
      .map(([key, val]) => `${key.replace('_', ' ').toUpperCase()}: ${val}`)
      .join(', ');

    const prompt = `User preferences collected: ${summary}. Greet them, briefly summarize these preferences in your retro style, and tell them you are now initiating the spot search scan.`;

    await sendToGemini(prompt, true);

    // Trigger the venue fetch now that onboarding is done
    triggerFetch(answersRef.current);
  };

  const sendToGemini = async (message: string, reset = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, reset }),
      });
      const data = await res.json();
      addMessage(data.response || data.error || "ERROR: NO RESPONSE", "ai");
    } catch {
      addMessage("COMMLINK FAILURE. IS THE BACKEND RUNNING ON PORT 3000?", "ai");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (option: string) => {
    addMessage(option, "user");
    setOptions([]);

    // Save the answer for this question
    const q = QUESTIONS[currentStep];
    answersRef.current[q.id] = option;

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setTimeout(() => askQuestion(nextStep), 400);
  };

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isOnboarding || isLoading) return;
    addMessage(text, "user");
    setInputValue("");
    sendToGemini(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  const handleRefresh = () => {
    setMessages([]);
    setCurrentStep(0);
    setOptions([]);
    setIsOnboarding(true);
    setIsLoading(false);
    answersRef.current = {};
    sessionStartedRef.current = false;
    setTimeout(() => {
      sessionStartedRef.current = true;
      addMessage("REBOOTING SPOT_SCOUT...", "ai");
      setTimeout(() => askQuestion(0), 600);
    }, 100);
  };

  return (
    <div className="h-full flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-violet-50/50 to-blue-50/50 dark:from-violet-900/20 dark:to-blue-900/20 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Spot Scout AI</h2>
        <Button onClick={handleRefresh} variant="ghost" size="sm" className="hover:bg-white/60 dark:hover:bg-slate-800/60" title="Restart chat">
          <RefreshCw className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${message.sender === "ai" ? "bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/30 dark:to-blue-900/30 border border-violet-200 dark:border-violet-800 text-slate-800 dark:text-slate-200" : "bg-gradient-to-r from-violet-500 to-blue-500 text-white"}`}>
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/30 dark:to-blue-900/30 border border-violet-200 dark:border-violet-800">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {options.length > 0 && (
        <div className="px-4 pb-2 flex flex-col gap-2">
          {options.map((opt) => (
            <button key={opt} onClick={() => handleOptionClick(opt)} className="w-full text-left px-3 py-2 text-xs font-semibold rounded-xl border border-violet-300 dark:border-violet-700 bg-white/60 dark:bg-slate-800/60 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-slate-700 dark:text-slate-300 transition-all hover:scale-[1.01]">
              {opt}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <div className="flex gap-2">
          <Input type="text" placeholder={isOnboarding ? "Pick an option above..." : "Ask the Spot Scout..."} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} disabled={isOnboarding || isLoading} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200 dark:border-slate-700 disabled:opacity-50" />
          <Button onClick={handleSend} size="icon" disabled={isOnboarding || isLoading} className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 transition-all hover:scale-110 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
