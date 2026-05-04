import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
      summary,
      full_name,
      professional_title,
      skills,
      work_experience,
    }: {
      summary: string;
      full_name?: string;
      professional_title?: string;
      skills?: string[];
      work_experience?: string[];
    } = await req.json();

    if (!summary || summary.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "请先填写自我评价内容（至少 10 个字符）" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contextLines: string[] = [];
    if (full_name) contextLines.push(`姓名：${full_name}`);
    if (professional_title) contextLines.push(`职位：${professional_title}`);
    if (skills && skills.length > 0) contextLines.push(`技能：${skills.slice(0, 10).join("、")}`);
    if (work_experience && work_experience.length > 0) contextLines.push(`工作经历：${work_experience.slice(0, 3).join("；")}`);
    const context = contextLines.length > 0 ? `\n\n## 候选人背景\n${contextLines.join("\n")}` : "";

    const systemPrompt = `你是一位专业的简历写作顾问。你的任务是优化求职者的自我评价，使其更加专业、精炼、有说服力，适合放在简历顶部。

要求：
1. 保持原有内容的核心意思，不要凭空添加候选人没有提及的经历或技能
2. 语言简洁有力，突出价值主张
3. 控制在 150-250 个汉字之间
4. 使用第一人称或去主语的简洁表达
5. 直接返回优化后的文本，不要添加任何解释、标题或 markdown 格式`;

    const userPrompt = `请优化以下自我评价：

## 原始自我评价
${summary}${context}

请直接返回优化后的文本，不要任何前缀或说明。`;

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
        max_tokens: 500,
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
    const optimized = data.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(
      JSON.stringify({ optimized }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
