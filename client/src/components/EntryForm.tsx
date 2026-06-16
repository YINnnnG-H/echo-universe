import { LoaderCircle, Mic, SendHorizonal } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSpeechInput } from "../hooks/useSpeechInput";
import { api } from "../services/api";
import type { Entry, EntryContext, EntryType } from "../types";
import { ENTRY_TYPE_OPTIONS } from "../utils/constants";
import { formatDateInput } from "../utils/format";

interface EntryFormProps {
  editingEntry?: Entry | null;
  onSaved?: (entry: Entry) => void | Promise<void>;
}

function defaultOccurredAt() {
  return formatDateInput(new Date().toISOString());
}

function resolveDeviceType() {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  return /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
    ? "mobile-browser"
    : "desktop-browser";
}

export function EntryForm({ editingEntry, onSaved }: EntryFormProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(editingEntry?.title || "");
  const [entryType, setEntryType] = useState<EntryType>(editingEntry?.entry_type || "reflection");
  const [rawText, setRawText] = useState(editingEntry?.raw_text || "");
  const [source, setSource] = useState(editingEntry?.source || "mobile-web");
  const [occurredAt, setOccurredAt] = useState(editingEntry ? formatDateInput(editingEntry.occurred_at) : defaultOccurredAt());
  const [context, setContext] = useState<EntryContext>(editingEntry?.context || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const speech = useSpeechInput((transcript) =>
    setRawText((current) => `${current}${current ? "\n" : ""}${transcript}`)
  );

  useEffect(() => {
    setTitle(editingEntry?.title || "");
    setEntryType(editingEntry?.entry_type || "reflection");
    setRawText(editingEntry?.raw_text || "");
    setSource(editingEntry?.source || "mobile-web");
    setOccurredAt(editingEntry ? formatDateInput(editingEntry.occurred_at) : defaultOccurredAt());
    setContext(editingEntry?.context || {});
  }, [editingEntry]);

  function updateContext<K extends keyof EntryContext>(key: K, value: EntryContext[K]) {
    setContext((current) => ({
      ...current,
      [key]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!rawText.trim()) {
      setToast("先写下一点内容，再点亮这颗星");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        title,
        entry_type: entryType,
        raw_text: rawText,
        source,
        occurred_at: new Date(occurredAt || defaultOccurredAt()).toISOString(),
        context,
        device: resolveDeviceType()
      };

      const savedEntry = editingEntry
        ? await api.updateEntry(editingEntry.id, payload)
        : await api.createEntry(payload);

      setToast(editingEntry ? "这颗星已经更新" : "新的星体已经归档");
      setTitle("");
      setRawText("");
      setEntryType("reflection");
      setOccurredAt(defaultOccurredAt());
      setContext({});
      await onSaved?.(savedEntry);
      window.setTimeout(() => setToast(""), 1800);

      if (!editingEntry) {
        navigate("/");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "保存失败，请稍后再试";
      setToast(message);
      window.setTimeout(() => setToast(""), 2500);
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeType = ENTRY_TYPE_OPTIONS.find((item) => item.value === entryType);
  const inputClass =
    "h-12 rounded-full border border-white/12 bg-[#112238] px-4 text-sm text-slate-50 outline-none transition placeholder:text-slate-400/70 focus:border-[#8fb0d6]";

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#081423cf] p-5 shadow-[0_24px_80px_rgba(2,6,16,0.3)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,215,161,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(127,167,201,0.16),transparent_36%)]" />
      <form onSubmit={handleSubmit} className="relative space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Forge A Star</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{editingEntry ? "编辑这颗星" : "写下一颗星"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300/75">
            在这里，你可以记录反思、播客、看展、音乐、运动，或任何让你停下来感受的时刻。
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="给这条记录起一个标题，比如：预感编码那一夜"
            className={inputClass}
          />
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/6 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">记录类型</p>
            <span className="text-xs text-slate-300/70">{activeType?.hint}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ENTRY_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEntryType(option.value)}
                className={`rounded-full px-3 py-2 text-sm transition hover:scale-[1.02] ${
                  entryType === option.value
                    ? "bg-[#f4d7a1]/18 text-[#f6e8ca] shadow-[0_0_22px_rgba(244,215,161,0.16)]"
                    : "bg-white/8 text-slate-300/78"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="写下内容本身，也写下它带来的感受、身体反应、联想、关系模式，或者你想继续回看的线索。"
          className="min-h-[220px] w-full rounded-[24px] border border-white/12 bg-[#112238] px-4 py-4 text-base leading-7 text-slate-50 outline-none transition placeholder:text-slate-400/70 focus:border-[#8fb0d6]"
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            value={context.subject || ""}
            onChange={(event) => updateContext("subject", event.target.value)}
            placeholder="主题 / 作品 / 内容名称"
            className={inputClass}
          />
          <input
            value={context.creator || ""}
            onChange={(event) => updateContext("creator", event.target.value)}
            placeholder="作者 / 主播 / 艺术家"
            className={inputClass}
          />
          <input
            value={context.location || ""}
            onChange={(event) => updateContext("location", event.target.value)}
            placeholder="地点"
            className={inputClass}
          />
          <input
            value={context.companions || ""}
            onChange={(event) => updateContext("companions", event.target.value)}
            placeholder="同行者 / 对话对象"
            className={inputClass}
          />
          <input
            value={context.body_state || ""}
            onChange={(event) => updateContext("body_state", event.target.value)}
            placeholder="身体感受，例如：肩膀松开了"
            className={inputClass}
          />
          <label className="flex h-12 items-center gap-3 rounded-full border border-white/12 bg-[#112238] px-4 text-sm text-slate-50">
            <span className="whitespace-nowrap text-slate-300/72">能量值</span>
            <input
              type="range"
              min="1"
              max="5"
              value={context.energy || 3}
              onChange={(event) => updateContext("energy", Number(event.target.value))}
              className="w-full accent-[#8fb0d6]"
            />
            <span>{context.energy || 3}</span>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="来源，例如：mobile-web / voice-note"
            className={inputClass}
          />
          <button
            type="button"
            onClick={speech.isListening ? speech.stop : speech.start}
            disabled={!speech.isSupported}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 text-sm text-slate-200 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mic size={16} />
            {speech.isListening ? "停止录音" : "语音输入"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#f4d7a1]/18 px-5 text-sm font-medium text-[#f6e8ca] shadow-[0_0_24px_rgba(244,215,161,0.14)] transition hover:scale-[1.02] disabled:opacity-70"
          >
            {isSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
            {editingEntry ? "保存轨迹" : "点亮这颗星"}
          </button>
        </div>
      </form>

      {toast ? (
        <div className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-[#07111f] px-4 py-2 text-sm text-white shadow-soft">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
