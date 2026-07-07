import { useState } from 'react';
import { HelpCircle, Search, Mail, Send, ChevronDown, ChevronUp, FileText } from 'lucide-react';

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(false);

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

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!ticketTitle.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setToast(true);
      setTicketTitle('');
      setTicketDesc('');
      setTimeout(() => setToast(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="font-headline text-3xl font-light" style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
          Help & Support
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
          Search technical documentations, review FAQs, or raise a support request ticket.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: FAQs and Documentation */}
        <div className="lg:col-span-7 space-y-6">
          
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

        {/* Right: Contact Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="font-headline text-base font-semibold text-white">Raise a Ticket</h3>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject / Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Groq API keys returning 401 error"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your issue with details (errors, logs, pipelines state)"
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-primary/50 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !ticketTitle.trim()}
                className="w-full btn-primary py-2.5 rounded-xl flex items-center justify-center gap-2 font-headline font-semibold text-xs transition-all cursor-pointer"
                style={{ opacity: (!ticketTitle.trim() || isSubmitting) ? 0.5 : 1 }}
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? "Submitting Request..." : "Submit Ticket"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Ticket Notification Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-300 shadow-2xl backdrop-blur-xl animate-scale-in">
          <FileText className="h-4 w-4 text-emerald-400" />
          <span>Support ticket submitted successfully! Reference ticket number: TP-{Math.floor(Math.random() * 90000 + 10000)}</span>
        </div>
      )}
    </div>
  );
}
