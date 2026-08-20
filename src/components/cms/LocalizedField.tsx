import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Localized, LangCode } from "@/lib/gallery/types";

export function LocalizedField({
  label,
  value,
  languages,
  multiline = false,
  placeholder,
  onChange,
  hint,
}: {
  label: string;
  value: Localized | undefined;
  languages: LangCode[];
  multiline?: boolean;
  placeholder?: string;
  hint?: string;
  onChange: (next: Localized) => void;
}) {
  const current = value ?? {};
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      <div className="space-y-1.5">
        {languages.map((lang) => {
          const props = {
            value: current[lang] ?? "",
            placeholder: placeholder ? `${placeholder} (${lang})` : lang.toUpperCase(),
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onChange({ ...current, [lang]: e.target.value }),
          };
          return (
            <div key={lang} className="flex items-start gap-2">
              <span className="mt-2 w-6 shrink-0 text-[11px] font-semibold uppercase text-muted-foreground">
                {lang}
              </span>
              {multiline ? <Textarea rows={3} {...props} /> : <Input {...props} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
