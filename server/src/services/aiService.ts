import type { AnalysisResult, EntryInput } from "../types.js";
import { heuristicAnalyze } from "../utils/analysis.js";

interface OpenAICompatibleResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function getApiKey() {
  return process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || "";
}

function parseJsonResponse(content: string, input: EntryInput): AnalysisResult {
  const cleaned = content.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<AnalysisResult>;
  const fallback = heuristicAnalyze(input);

  return {
    summary: parsed.summary || fallback.summary,
    tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags.slice(0, 6) : fallback.tags,
    emotion:
      parsed.emotion === "positive" || parsed.emotion === "neutral" || parsed.emotion === "negative"
        ? parsed.emotion
        : fallback.emotion,
    personality_indicators:
      parsed.personality_indicators && typeof parsed.personality_indicators === "object"
        ? parsed.personality_indicators
        : fallback.personality_indicators,
    needs_retry: false,
    provider: process.env.AI_MODEL || "openai-compatible"
  };
}

async function callOpenAICompatible(input: EntryInput): Promise<AnalysisResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing API key");
  }

  const payload = {
    title: input.title || "",
    entry_type: input.entry_type || "reflection",
    raw_text: input.raw_text,
    context: input.context || {}
  };

  const response = await fetch(`${process.env.AI_BASE_URL || "https://api.deepseek.com"}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "deepseek-v4-pro",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "你是一个帮助用户回溯生活体验的中文分析助手。请严格返回 JSON，字段为 summary、tags、emotion、personality_indicators。summary 不超过 50 个中文字符；tags 返回 4 到 6 个更细颗粒度、高信息密度、适合长期回溯的标签，避免空泛词；emotion 只能是 positive、neutral、negative；personality_indicators 返回 0 到 1 的数值或布尔值。请优先识别更具体的主题，如考试焦虑、边界练习、认知模型、音乐共振、展览观看、身体感受、依恋模式、清醒时刻、意义感、投射识别、节律恢复、关系修复。"
        },
        {
          role: "user",
          content: `请分析这条记录：${JSON.stringify(payload)}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenAICompatibleResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI response missing content");
  }

  return parseJsonResponse(content, input);
}

export async function analyzeEntry(input: EntryInput): Promise<AnalysisResult> {
  const provider = process.env.AI_PROVIDER || "heuristic";

  if (provider !== "openai-compatible") {
    return heuristicAnalyze(input);
  }

  try {
    return await callOpenAICompatible(input);
  } catch {
    return {
      ...heuristicAnalyze(input),
      needs_retry: true
    };
  }
}
