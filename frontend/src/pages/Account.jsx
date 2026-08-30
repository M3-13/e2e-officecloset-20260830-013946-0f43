import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const response = await client.delete("/api/account");
      if (!response.ok) {
        throw new Error("Der Account konnte nicht gelöscht werden.");
      }
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Der Account konnte nicht gelöscht werden.");
      setBusy(false);
    }
  }

  return (
    <section className="page max-w-3xl">
      <h1 className="mb-6 text-[32px] font-semibold">Konto</h1>

      <div className="rounded-lg border border-line bg-[#1B1712] p-4">
        <p className="text-sm text-muted">Angemeldet als</p>
        <p className="text-fg">{user?.email || "Unbekannt"}</p>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-[#1B1712] p-4">
        <h2 className="mb-2 text-[20px] font-semibold">Account löschen</h2>
        <p className="mb-4 text-muted">
          Wenn Sie Ihren Account löschen, werden alle Ihre Garderobenstücke, Outfits und
          Bilder dauerhaft entfernt. Dies kann nicht rückgängig gemacht werden.
        </p>
        {error && <p className="mb-4 text-[#C04A3A]">{error}</p>}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-md bg-[#C04A3A] px-6 py-3 font-semibold text-fg transition-all hover:bg-[#D15B4A] active:bg-[#A63B2D]"
        >
          Account löschen
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,8,6,0.7)] p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-[480px] rounded-lg border border-line bg-[#1B1712] p-6 shadow-2xl"
          >
            <h2 id="delete-account-title" className="mb-2 text-[20px] font-semibold">
              Account wirklich löschen?
            </h2>
            <p className="mb-6 text-muted">
              Dieser Vorgang ist endgültig und kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="rounded-md border border-line px-6 py-3 font-semibold text-fg transition-all hover:bg-[#1B1712] hover:border-muted disabled:opacity-45"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="rounded-md bg-[#C04A3A] px-6 py-3 font-semibold text-fg transition-all hover:bg-[#D15B4A] active:bg-[#A63B2D] disabled:opacity-45"
              >
                {busy ? "Wird gelöscht…" : "Endgültig löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
