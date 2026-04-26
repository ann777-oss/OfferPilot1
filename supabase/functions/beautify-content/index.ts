import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type BeautifyMode = "bullets" | "description" | "highlights";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) {
      return new Response(
        JSON.stringify({ error: "DeepSeek API Key 未配置" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      mode,
      content,
      context,
    }: {
      mode: BeautifyMode;
      content: string | string[];
      context?: string;
    } = await req.json();

    if (!mode || content === undefined || content === null) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数 mode 或 content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "bullets") {
      const bullets = Array.isArray(content) ? content : [content as string];
      const nonEmpty = bullets.filter((b) => b.trim().length > 0);
      if (nonEmpty.length === 0) {
        return new Response(
          JSON.stringify({ error: "请先填写至少一条成就亮点" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      systemPrompt = `你是一位专业的简历写作顾问。你的任务是优化简历中的工作成就亮点（bullet points），使其更加专业、量化、有说服力。

要求：
1. 每条以强动词开头（如"主导"、"构建"、"优化"、"推动"等）
2. 尽量体现量化数据（如百分比、金额、用户数等）——若原文无数据则保持原意，不可虚构数字
3. 简洁有力，每条不超过 50 个汉字
4. 严格按照 JSON 数组格式返回，数组长度与输入一致
5. 不要添加任何解释或 markdown，直接返回 JSON 数组`;

      userPrompt = `请优化以下工作成就亮点：
${context ? `背景：${context}\n` : ""}
原始内容：
${nonEmpty.map((b, i) => `${i + 1}. ${b}`).join("\n")}

请直接返回 JSON 数组，格式如：["优化后的第1条", "优化后的第2条"]`;
    } else if (mode === "description") {
      const text = Array.isArray(content) ? content.join("") : content as string;
      if (text.trim().length < 5) {
        return new Response(
          JSON.stringify({ error: "请先填写描述内容（至少 5 个字符）" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      systemPrompt = `你是一位专业的简历写作顾问。你的任务是优化简历中的描述文字，使其更加清晰、专业、有吸引力。

要求：
1. 保持原有内容核心意思，不添加不存在的信息
2. 语言精炼，突出价值与目标
3. 不超过 150 个汉字
4. 直接返回优化后的文本，不要任何前缀、说明或 markdown`;

      userPrompt = `请优化以下描述：
${context ? `背景：${context}\n` : ""}
原始内容：
${text}

请直接返回优化后的文本。`;
    } else if (mode === "highlights") {
      const items = Array.isArray(content) ? content : [content as string];
      const nonEmpty = items.filter((h) => h.trim().length > 0);
      if (nonEmpty.length === 0) {
        return new Response(
          JSON.stringify({ error: "请先填写至少一条亮点内容" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      systemPrompt = `你是一位专业的简历写作顾问。你的任务是优化简历中的项目亮点或活动亮点，使其更加专业、有说服力。

要求：
1. 每条以强动词或关键成果开头
2. 尽量包含可量化的指标，若原文无数据则不可虚构
3. 简洁有力，每条不超过 50 个汉字
4. 严格按照 JSON 数组格式返回，数组长度与输入一致
5. 不要添加任何解释或 markdown，直接返回 JSON 数组`;

      userPrompt = `请优化以下亮点内容：
${context ? `背景：${context}\n` : ""}
原始内容：
${nonEmpty.map((h, i) => `${i + 1}. ${h}`).join("\n")}

请直接返回 JSON 数组，格式如：["优化后的第1条", "优化后的第2条"]`;
    } else {
      return new Response(
        JSON.stringify({ error: "不支持的 mode 类型" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(
        JSON.stringify({ error: `AI 服务请求失败: ${err}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

    if (mode === "description") {
      return new Response(
        JSON.stringify({ result: raw }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // bullets / highlights — parse JSON array
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "AI 返回格式异常，请重试" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const result: string[] = JSON.parse(jsonMatch[0]);
    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
