import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OCCASION_TAGS } from "../constants";
import { isValidTag, parseTags } from "../product-form";

function appendTag(current: string, tag: string): string {
  return current.trim() ? `${current.trim().replace(/,\s*$/, "")}, ${tag}` : tag;
}

function TagChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tags.map((t) => (
        <span
          key={t}
          className={`px-2 py-0.5 rounded-full text-xs ${isValidTag(t) ? "bg-slate-100 text-slate-700" : "bg-red-100 text-red-700"}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function OccasionButtons({ current, onAdd }: { current: string[]; onAdd: (tag: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1 mt-2 text-xs text-muted-foreground">
      <span>Occasions:</span>
      {OCCASION_TAGS.map((t) => (
        <button
          key={t}
          type="button"
          disabled={current.includes(t)}
          onClick={() => onAdd(t)}
          className="px-2 py-0.5 rounded-full border hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + {t}
        </button>
      ))}
    </div>
  );
}

export function ProductTagsField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const parsed = parseTags(value);
  return (
    <div>
      <Label htmlFor="tags">Tags</Label>
      <Input
        id="tags"
        placeholder="birthday, anniversary, roses"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={parsed.error ? true : undefined}
      />
      {parsed.error ? <p className="text-xs text-red-600 mt-1">{parsed.error}</p> : null}
      <TagChips tags={parsed.tags} />
      <OccasionButtons current={parsed.tags} onAdd={(t) => onChange(appendTag(value, t))} />
    </div>
  );
}
