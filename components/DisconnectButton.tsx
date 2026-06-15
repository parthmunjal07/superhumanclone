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
      className="inline-flex items-center justify-center px-6 py-2.5 bg-[#FECDD3] text-[#881337] border border-[#FDA4AF] text-[15px] font-semibold rounded-full hover:bg-[#FDA4AF] transition-colors shadow-sm disabled:opacity-50"
    >
      {loading ? 'Disconnecting...' : `Disconnect ${label}`}
    </button>
  );
}
