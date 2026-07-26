import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, Sparkles } from "lucide-react";
import { useAuth } from "../App";
import { recognizeFabric, FabricRecognitionResult } from "../api";
import { COLORS } from "../design-system/brand";

export default function FabricRecognition() {
  const { me } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<FabricRecognitionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!me) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setLoading(true);
    const data = await recognizeFabric(me.weaver.id, file);
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Fabric Image Recognition
        </h1>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          Upload a photo of a fabric to detect its pattern, predicted category, and an estimated selling price.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          onClick={() => fileRef.current?.click()}
          className="rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center text-center cursor-pointer"
          style={{ borderColor: `${COLORS.emeraldDeep}40`, backgroundColor: COLORS.warmWhite, minHeight: 260 }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {preview ? (
            <img src={preview} alt="Uploaded fabric" className="max-h-52 rounded-xl object-contain" />
          ) : (
            <>
              <UploadCloud size={32} style={{ color: COLORS.emeraldDeep, opacity: 0.6 }} />
              <p className="text-sm mt-3 font-medium" style={{ color: COLORS.emeraldDeep }}>Click to upload a fabric photo</p>
              <p className="text-xs mt-1" style={{ color: COLORS.charcoalText, opacity: 0.5 }}>JPG or PNG</p>
            </>
          )}
        </div>

        <div className="rounded-2xl border p-6" style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}>
          {loading && <p style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Analyzing image...</p>}
          {!loading && !result && <p style={{ color: COLORS.charcoalText, opacity: 0.5 }}>Upload an image to see results here.</p>}
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: COLORS.gold }} />
                <p className="text-sm font-semibold" style={{ color: COLORS.emeraldDeep }}>Detected pattern</p>
              </div>
              <p className="text-sm" style={{ color: COLORS.charcoalText }}>{result.detected_pattern}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ backgroundColor: "#F4F1E9" }}>
                  <p className="text-[11px]" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>Predicted category</p>
                  <p className="text-sm font-bold" style={{ color: COLORS.emeraldDeep }}>{result.predicted_category}</p>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: "#F4F1E9" }}>
                  <p className="text-[11px]" style={{ color: COLORS.charcoalText, opacity: 0.55 }}>Estimated price</p>
                  <p className="text-sm font-bold" style={{ color: COLORS.emeraldDeep }}>&#8377;{result.estimated_price}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: result.avg_color_hex, borderColor: "#EAE4D6" }} />
                <p className="text-xs" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Dominant tone: {result.hue_bucket} ({result.avg_color_hex})</p>
              </div>

              {result.similar_products.length > 0 && (
                <div className="pt-3 border-t" style={{ borderColor: "#EAE4D6" }}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Similar products in your region</p>
                  <ul className="text-sm space-y-1">
                    {result.similar_products.map((p) => (
                      <li key={p} style={{ color: COLORS.charcoalText }}>&bull; {p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}