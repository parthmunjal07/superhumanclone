export default function SettingsPage() {
  return (
    <div className="flex-1 p-8 bg-black">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>
      
      <div className="max-w-2xl">
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Integrations</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Connect your external accounts to sync data seamlessly via Corsair.
          </p>
          
          <div className="flex items-center justify-between py-4 border-t border-zinc-800">
            <div>
              <h3 className="font-medium text-white">Gmail</h3>
              <p className="text-sm text-zinc-500">Sync your inbox and send emails</p>
            </div>
            <a 
              href="/api/integrations/gmail/connect"
              className="px-4 py-2 bg-white text-black font-medium rounded-md hover:bg-zinc-200 transition-colors"
            >
              Connect Gmail
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
