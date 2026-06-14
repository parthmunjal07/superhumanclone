"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DisconnectButton({ integration, label }: { integration: string; label: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/auth/connect/${integration}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      } else {
        console.error('Failed to disconnect');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDisconnect}
      disabled={loading}
      className="px-4 py-2 bg-red-500/10 text-red-500 font-medium rounded-md hover:bg-red-500/20 transition-colors disabled:opacity-50"
    >
      {loading ? 'Disconnecting...' : `Disconnect ${label}`}
    </button>
  );
}
