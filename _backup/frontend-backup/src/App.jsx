export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">RHW Research & Knowledge Base</h1>
        <p className="text-slate-400 mb-8">Firm-wide research database with SOPs, policies, and Q&A transcripts</p>

        <div className="glass rounded-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Welcome</h2>
          <p className="text-slate-300">
            This application is being built to centralize RHW CPAs research, documentation, and institutional knowledge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass glass-button rounded-lg p-6 glow-sky cursor-pointer hover:shadow-lg transition-all">
            <h3 className="font-semibold text-white mb-2">Search Research</h3>
            <p className="text-sm text-slate-400">Find SOPs, policies, and case studies</p>
          </div>

          <div className="glass glass-button rounded-lg p-6 glow-amber cursor-pointer hover:shadow-lg transition-all">
            <h3 className="font-semibold text-white mb-2">Submit Memo</h3>
            <p className="text-sm text-slate-400">Contribute to the knowledge base</p>
          </div>

          <div className="glass glass-button rounded-lg p-6 glow-emerald cursor-pointer hover:shadow-lg transition-all">
            <h3 className="font-semibold text-white mb-2">Admin Panel</h3>
            <p className="text-sm text-slate-400">Manage approvals and users</p>
          </div>
        </div>
      </main>
    </div>
  );
}
