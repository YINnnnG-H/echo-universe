import type { AnalysisResult, EntryInput } from "../types.js";
import { heuristicAnalyze } from "../utils/analysis.js";
import { normalizeAnalysisInput } from "../utils/insightNormalization.js";

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
  const emotion =
    parsed.emotion === "positive" || parsed.emotion === "neutral" || parsed.emotion === "negative"
      ? parsed.emotion
      : fallback.emotion;
  const normalized = normalizeAnalysisInput(input, {
    emotion,
    tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags.slice(0, 6) : fallback.tags,
    personality_indicators:
      parsed.personality_indicators && typeof parsed.personality_indicators === "object"
        ? parsed.personality_indicators
        : fallback.personality_indicators
  });

  return {
    summary: parsed.summary || fallback.summary,
    tags: normalized.tags,
    emotion,
    personality_indicators: normalized.personality_indicators,
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
            "你是一个帮助用户回看生活体验的中文分析助手。请严格返回 JSON，字段为 summary、tags、emotion、personality_indicators。summary 不超过 50 个中文字符。tags 请优先使用这些统一中文标签：自我观察、梦境回放、潜意识线索、考试焦虑、依恋模式、边界练习、播客启发、认知模型、展览观看、音乐共振、运动恢复、阅读摘记、对话复盘、身体感受、投射识别、过度分析、创作冲动、节律恢复、自我整合、孤独感、意义追问、清醒时刻、感官打开、关系修复、焦虑波动、创作者线索、输入型内容、生活切片。emotion 只能是 positive、neutral、negative。personality_indicators 请优先使用这些连续维度：反思深度、结构整合、身体觉察、情绪唤醒、情绪效价、自主感、联结感、胜任感、意义感、探索驱动、恢复弹性、过度分析、关系敏感。数值尽量落在 0 到 0.9 之间，不要大量使用 1.0。六个原型：孤儿原型、战士原型、疗愈者原型、女王原型、智者原型、寻找者原型，只在证据足够明显时才给分，而且最多突出 1 到 2 个，把它们当作叙事母题而不是人格定论。"
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
