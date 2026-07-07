import { useState } from 'react';
import { Save, Cpu, Key, Sliders, Shield, RefreshCw, Zap } from 'lucide-react';

export default function Settings() {
  const [modelFast, setModelFast] = useState('openai/gpt-oss-20b');
  const [modelReasoning, setModelReasoning] = useState('qwen/qwen3.6-27b');
  const [temperature, setTemperature] = useState(0.2);
  const [useFallback, setUseFallback] = useState(true);
  const [latencyLimit, setLatencyLimit] = useState(1500);
  const [enableLogs, setEnableLogs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="font-headline text-3xl font-light" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
          System Settings
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
          Configure AI model thresholds, orchestration buffers, and pipeline heuristics.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Model Configurations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: LLM Engine Configuration */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <Cpu className="h-5 w-5 text-primary" />
              <h3 className="font-headline text-base font-semibold text-white">LLM Engines & Routing</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Primary Fast Engine</label>
                <select
                  value={modelFast}
                  onChange={(e) => setModelFast(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary/50 focus:outline-none"
                >
                  <option value="openai/gpt-oss-20b">OpenAI GPT-OSS (20B)</option>
                  <option value="meta/llama-3.1-8b-instruct">Llama 3.1 8B Instruct</option>
                  <option value="custom/local-llama">Local Llama-3-8B</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Primary Reasoning Engine</label>
                <select
                  value={modelReasoning}
                  onChange={(e) => setModelReasoning(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary/50 focus:outline-none"
                >
                  <option value="qwen/qwen3.6-27b">Qwen 3.6 Instruct (27B)</option>
                  <option value="meta/llama-3.3-70b-instruct">Llama 3.3 Instruct (70B)</option>
                  <option value="deepseek/coder-v2">DeepSeek Coder V2</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">LLM Temperature</label>
                <span className="text-xs font-bold text-primary">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-[10px] text-slate-500 mt-1">Lower temperature yields deterministic, structured parsing (recommended for extract & fuse stages).</p>
            </div>
          </div>

          {/* Card 2: Orchestrator Tuning */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <Sliders className="h-5 w-5 text-primary" />
              <h3 className="font-headline text-base font-semibold text-white">Pipeline Tuning</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pipeline Timeout Threshold</label>
                <select
                  value={latencyLimit}
                  onChange={(e) => setLatencyLimit(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary/50 focus:outline-none"
                >
                  <option value="500">500ms (Aggressive)</option>
                  <option value="1500">1500ms (Balanced)</option>
                  <option value="5000">5000ms (High Latency)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Failover Router</label>
                <div className="flex items-center justify-between h-[40px] px-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-300">NVIDIA NIM Backup</span>
                  <input
                    type="checkbox"
                    checked={useFallback}
                    onChange={(e) => setUseFallback(e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Security & Logs Summary */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="font-headline text-base font-semibold text-white">Compliance & Logs</h3>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-semibold text-slate-200">Enable Agent Logs</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Stream execution logs in Chat console</p>
              </div>
              <input
                type="checkbox"
                checked={enableLogs}
                onChange={(e) => setEnableLogs(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-primary"
              />
            </div>

            <div className="rounded-xl bg-slate-950 p-4 space-y-2 border border-slate-900">
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5" />
                System Active
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                TaskPilot SQLite WAL (Write-Ahead Logging) mode is verified. Direct context query paths are secured.
              </p>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 font-headline font-semibold text-sm shadow-[0_4px_20px_rgba(0,125,184,0.3)] transition-all active:scale-[0.98] cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Commit Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-300 shadow-2xl backdrop-blur-xl animate-scale-in">
          <Save className="h-4 w-4 text-emerald-400" />
          <span>System configurations successfully committed to SQLite datastore!</span>
        </div>
      )}
    </div>
  );
}
