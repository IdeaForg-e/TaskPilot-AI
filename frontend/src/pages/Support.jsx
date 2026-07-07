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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="font-headline text-3xl font-light" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
          Help & Support
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
          Search technical documentations and review frequently asked questions.
        </p>
      </div>

      {/* FAQ Search */}
      <div className="glass-card p-4 flex items-center gap-3">
        <Search className="h-4 w-4" style={{ color: 'var(--outline)' }} />
        <input
          type="text"
          placeholder="Search knowledge base articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder-slate-500"
        />
      </div>

      {/* FAQs List */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h3 className="font-headline text-base font-semibold text-white">Frequently Asked Questions</h3>
        </div>

        {filteredFaqs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6 font-body">No articles match your search query.</p>
        ) : (
          <div className="space-y-2.5">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-xs font-semibold text-left text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed font-body border-t border-slate-900 pt-3">
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
