import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-teal-500 selection:text-slate-950">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-teal-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none rounded-full" />

      <main className="relative z-10 max-w-4xl w-full text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-teal-400 text-sm font-semibold tracking-wide shadow-inner">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          TaskPilot AI Setup Complete
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-200 via-emerald-300 to-purple-300">
            TaskPilot AI
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Autonomous multi-agent engineering workflow assistant. Reducing context fragmentation across Jira, GitHub, Slack, and email.
          </p>
        </div>

        {/* Action / Status Section */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
            <h2 className="text-xl font-bold text-teal-400 flex items-center gap-2">
              🚀 Hackathon Team Tasks
            </h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✔</span> Dev 1: Backend & Database Setup
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✔</span> Dev 2: Ingestion & Extraction Agents
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✔</span> Dev 3: Quality & Priority Agents
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✔</span> Dev 4: React Dashboard Implementation
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✔</span> Dev 5: Pipeline Integration & Orchestrator
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
            <h2 className="text-xl font-bold text-purple-400 flex items-center gap-2">
              🛠️ Local Setup Guide
            </h2>
            <div className="space-y-3 text-xs font-mono text-slate-300">
              <div>
                <p className="text-slate-500 font-sans mb-1">Backend Setup:</p>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-purple-300 select-all">
                  cd backend && pip install -r requirements.txt
                </div>
              </div>
              <div>
                <p className="text-slate-500 font-sans mb-1">Frontend Setup:</p>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-teal-300 select-all">
                  cd frontend && npm install && npm run dev
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-600 font-semibold tracking-wider uppercase pt-8">
          Dell Hackathon 2026 • June 19-20
        </p>
      </main>
    </div>
  );
}

export default App;
