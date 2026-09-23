import { useState } from 'react';
import { HelpCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "How do I run the full pipeline?",
      a: "Go to the Command Center (Dashboard) page and click the primary 'Run Pipeline' button in the top right header. The system will sequentially execute all 6 stages of the AI orchestrator agent and update tasks in real-time."
    },
    {
      q: "What does the Quality Assurance score measure?",
      a: "The Quality Agent evaluates incoming tasks across 7 dimensions (Clear Title, Error Logs, Reproduction Steps, Environment specification, Expected Behavior, Severity level, and Assignee assignment). A score out of 100% is computed based on documentation completeness."
    },
    {
      q: "How does the AI Planner protect meetings?",
      a: "The Daily Planning Agent retrieves event slots from calendar.json. It computes focus hours by deducting meeting timings and buffer hours from your 8-hour workday, scheduling priority backlog tasks strictly around your protected meeting slots."
    },
    {
      q: "What are fused signals and context links?",
      a: "When the same bug/feature is reported across different channels (e.g. email escalation + GitHub issue), the Fusion Agent matches them via semantic similarity, merging them into a single MasterTask while creating ContextLinks tracing back to the raw source data."
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="pb-3 border-b border-[#1e293b]">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,210,255,0.8)]" />
          <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 font-semibold">
            KNOWLEDGE_BASE // PROTOCOLS
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Help & Support
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Search technical documentations and review frequently asked questions.
        </p>
      </div>

      {/* FAQ Search */}
      <div className="cockpit-card p-3 flex items-center gap-2.5 bg-[#0f172a] border border-[#1e293b]">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search knowledge base articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder-slate-500"
        />
      </div>

      {/* FAQs List */}
      <div className="cockpit-card p-5 space-y-4 bg-[#0f172a] border border-[#1e293b]">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#1e293b]">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
            <HelpCircle className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
            Frequently Asked Questions
          </h3>
        </div>

        {filteredFaqs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6 font-mono">No articles match your search query.</p>
        ) : (
          <div className="space-y-2">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className={`rounded border transition-colors ${
                    isOpen ? 'border-cyan-500/40 bg-[#090d16]' : 'border-[#1e293b] bg-[#090d16]/70 hover:border-slate-600'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-3.5 text-xs font-medium text-left text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-cyan-400" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </button>
                  
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 text-xs text-slate-300 leading-relaxed border-t border-[#1e293b] pt-2.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
