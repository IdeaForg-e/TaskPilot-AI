import { useState } from 'react';
import { Cpu, Sliders, Check } from 'lucide-react';

export default function Settings() {
  const [modelFast, setModelFast] = useState('openai/gpt-oss-20b');
  const [modelReasoning, setModelReasoning] = useState('qwen/qwen3.6-27b');
  const [temperature, setTemperature] = useState(0.2);
  const [useFallback, setUseFallback] = useState(true);
  const [latencyLimit, setLatencyLimit] = useState(1500);

  return (
    <div className="space-y-5 animate-fade-in-up max-w-5xl">
      {/* Header */}
      <div className="pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
          <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 font-semibold">
            CONFIG_ORCHESTRATION // PARAMETERS
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          System Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure AI model thresholds, orchestration buffers, and pipeline heuristics.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: LLM Engine Configuration */}
        <div className="cockpit-card p-5 space-y-4 bg-[#0f172a] border border-[#1e293b] shadow-xl">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#1e293b]">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <Cpu className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
              LLM Engines & Routing
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Primary Fast Engine
              </label>
              <div className="relative">
                <select
                  value={modelFast}
                  onChange={(e) => setModelFast(e.target.value)}
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none appearance-none font-mono"
                >
                  <option value="openai/gpt-oss-20b">OpenAI GPT-OSS (20B)</option>
                  <option value="meta/llama-3.1-8b-instruct">Llama 3.1 8B Instruct</option>
                  <option value="custom/local-llama">Local Llama-3-8B</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[9px]">
                  ▼
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Primary Reasoning Engine
              </label>
              <div className="relative">
                <select
                  value={modelReasoning}
                  onChange={(e) => setModelReasoning(e.target.value)}
                  className="w-full bg-[#090d16] border border-[#1e293b] rounded px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none appearance-none font-mono"
                >
                  <option value="qwen/qwen3.6-27b">Qwen 3.6 Instruct (27B)</option>
                  <option value="meta/llama-3.3-70b-instruct">Llama 3.3 Instruct (70B)</option>
                  <option value="deepseek/coder-v2">DeepSeek Coder V2</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[9px]">
                  ▼
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                LLM Temperature
              </label>
              <span className="text-xs font-bold text-cyan-400 font-mono">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#090d16] border border-[#1e293b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              Lower temperature yields deterministic, structured parsing (recommended for extract & fuse stages).
            </p>
          </div>
        </div>

        {/* Card 2: Orchestrator Tuning */}
        <div className="cockpit-card p-5 space-y-4 flex flex-col justify-between bg-[#0f172a] border border-[#1e293b] shadow-xl">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#1e293b]">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
                <Sliders className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
                Pipeline Tuning
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
              <div>
                <label className="block text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Pipeline Timeout Limit
                </label>
                <div className="relative">
                  <select
                    value={latencyLimit}
                    onChange={(e) => setLatencyLimit(parseInt(e.target.value))}
                    className="w-full bg-[#090d16] border border-[#1e293b] rounded px-3 py-2 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none appearance-none font-mono"
                  >
                    <option value="500">500ms (Aggressive)</option>
                    <option value="1500">1500ms (Balanced)</option>
                    <option value="5000">5000ms (High Latency)</option>
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[9px]">
                    ▼
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  Failover Router
                </label>
                <div 
                  onClick={() => setUseFallback(!useFallback)}
                  className="flex items-center justify-between h-[36px] px-3 bg-[#090d16] border border-[#1e293b] rounded cursor-pointer hover:border-slate-600 transition-colors"
                >
                  <span className="text-xs text-slate-300">NVIDIA NIM Backup</span>
                  <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                    useFallback ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-[#0f172a] border-[#1e293b]'
                  }`}>
                    {useFallback && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-mono">
            Configuration updates apply instantaneously on client-side requests using default system state hooks.
          </p>
        </div>

      </div>
    </div>
  );
}
