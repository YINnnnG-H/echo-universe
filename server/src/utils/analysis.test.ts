import test from "node:test";
import assert from "node:assert/strict";
import { heuristicAnalyze } from "./analysis.js";

test("heuristic analysis extracts finer-grained tags and indicators from reflective text", () => {
  const result = heuristicAnalyze({
    entry_type: "podcast",
    title: "预测编码那一集",
    raw_text: "今天听完播客后，我开始理解自己在关系里为什么会焦虑，并且总是过度分析边界和冲突。",
    context: {
      subject: "预测编码"
    }
  });

  assert.equal(result.emotion, "negative");
  assert.ok(result.tags.includes("播客启发"));
  assert.ok(result.tags.includes("认知模型"));
  assert.ok(result.tags.includes("依恋模式"));
  assert.ok(result.tags.includes("过度分析"));
  assert.ok("Ti" in result.personality_indicators);
  assert.ok("过度分析" in result.personality_indicators);
});
