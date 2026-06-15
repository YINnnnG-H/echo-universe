import type { TagStat } from "../types";

interface TagCloudProps {
  tags: TagStat[];
  activeTag?: string;
  onSelect: (tag: string) => void;
}

export function TagCloud({ tags, activeTag, onSelect }: TagCloudProps) {
  return (
    <section className="rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">标签云</h2>
        <span className="text-xs text-stone-500">{tags.length} 个主题</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.tag}
            type="button"
            onClick={() => onSelect(tag.tag)}
            className={`rounded-pill px-3 py-2 text-sm transition hover:scale-[1.02] ${
              activeTag === tag.tag
                ? "bg-sage text-ink shadow-soft"
                : "bg-fog text-stone-600 hover:bg-shell"
            }`}
            style={{ fontSize: `${0.88 + Math.min(tag.count, 5) * 0.08}rem` }}
          >
            #{tag.tag} <span className="opacity-70">{tag.count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
