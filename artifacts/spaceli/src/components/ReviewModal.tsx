import { useState } from "react";
import { X, Star } from "lucide-react";
import { useCreateReview, getListReviewsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  bookingId: number;
  plassId: number;
  plassTittel: string;
  onClose: () => void;
}

export default function ReviewModal({ bookingId, plassId, plassTittel, onClose }: Props) {
  const [rangering, setRangering] = useState(0);
  const [hover, setHover] = useState(0);
  const [kommentar, setKommentar] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const createReview = useCreateReview();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rangering) return;
    createReview.mutate(
      { id: plassId, data: { bookingId, rangering, kommentar: kommentar || null } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey(plassId) });
          setSubmitted(true);
          setTimeout(onClose, 1800);
        },
      }
    );
  };

  const starLabels = ["", "Dårlig", "Under middels", "OK", "Bra", "Utmerket"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              Takk for anmeldelsen!
            </h3>
            <p className="text-white/50 text-sm">Din tilbakemelding hjelper andre brukere.</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
              Anmeld plassen
            </h3>
            <p className="text-white/50 text-sm mb-5">{plassTittel}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <p className="text-xs text-white/50 mb-2">Rangering</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRangering(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        fill={(hover || rangering) >= star ? "#F59E0B" : "transparent"}
                        stroke={(hover || rangering) >= star ? "#F59E0B" : "rgba(255,255,255,0.2)"}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                  {(hover || rangering) > 0 && (
                    <span className="ml-2 text-sm text-white/60">{starLabels[hover || rangering]}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Kommentar (valgfritt)</label>
                <textarea
                  value={kommentar}
                  onChange={(e) => setKommentar(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Beskriv erfaringen din med denne plassen..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
                <p className="text-xs text-white/30 text-right mt-1">{kommentar.length}/500</p>
              </div>

              <button
                type="submit"
                disabled={!rangering || createReview.isPending}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-opacity disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #00B4D8, #0077A8)" }}
              >
                {createReview.isPending ? "Sender..." : "Send anmeldelse"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
