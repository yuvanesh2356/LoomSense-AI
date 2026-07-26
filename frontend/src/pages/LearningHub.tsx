import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle, FileText, BookOpen, ExternalLink } from "lucide-react";
import { getLearningResources, LearningResource } from "../api";
import { COLORS } from "../design-system/brand";

const TYPE_ICONS: Record<string, any> = { video: PlayCircle, pdf: FileText, article: BookOpen };
const CATEGORIES = ["All", "Video Tutorials", "Government PDFs", "Best Practices", "Traditional Techniques", "Modern Methods"];

export default function LearningHub() {
  const [resources, setResources] = useState<LearningResource[] | null>(null);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLearningResources(category === "All" ? undefined : category).then((data) => {
      setResources(data);
      setLoading(false);
    });
  }, [category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold" style={{ color: COLORS.emeraldDeep }}>
          Learning Hub
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>
          Tutorials, government resources, and best practices for handloom weaving.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: category === c ? COLORS.emeraldDeep : "#F4F1E9",
              color: category === c ? COLORS.warmWhite : COLORS.charcoalText,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {loading || !resources ? (
        <div style={{ color: COLORS.charcoalText, opacity: 0.6 }}>Loading resources...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r, i) => {
            const Icon = TYPE_ICONS[r.resource_type] ?? BookOpen;
            return (
              <motion.a
                key={r.id}
                href={r.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border p-5 block"
                style={{ backgroundColor: COLORS.warmWhite, borderColor: "#EAE4D6" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${COLORS.gold}20` }}>
                  <Icon size={18} style={{ color: COLORS.emeraldDeep }} />
                </div>
                <p className="font-display font-semibold text-sm" style={{ color: COLORS.emeraldDeep }}>{r.title}</p>
                <p className="text-xs mt-1" style={{ color: COLORS.charcoalText, opacity: 0.65 }}>{r.description}</p>
                <div className="flex items-center justify-between mt-3 text-[11px]" style={{ color: COLORS.charcoalText, opacity: 0.5 }}>
                  <span>{r.category}</span>
                  <span className="flex items-center gap-1">{r.duration_minutes ? `${r.duration_minutes} min` : "Open"} <ExternalLink size={11} /></span>
                </div>
              </motion.a>
            );
          })}
        </div>
      )}
    </div>
  );
}