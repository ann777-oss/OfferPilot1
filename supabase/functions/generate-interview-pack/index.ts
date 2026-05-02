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
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { resumeContent, jobAnalysis, jobDescription } = await req.json();

    if (!resumeContent || !jobAnalysis || !jobDescription) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 构建用户经历摘要
    const experienceSummary = resumeContent.experience
      ?.slice(0, 3)
      .map((exp: any) => `${exp.company} - ${exp.role}: ${exp.bullets.slice(0, 2).join('; ')}`)
      .join('\n');

    const projectSummary = resumeContent.projects
      ?.slice(0, 2)
      .map((proj: any) => `${proj.name}: ${proj.description}`)
      .join('\n');

    const skillsSummary = resumeContent.skills
      ?.map((s: any) => `${s.category}: ${s.items.join(', ')}`)
      .join('\n');

    const systemPrompt = `你是一位资深面试官和职业顾问，擅长帮助求职者准备面试。

你的任务是基于候选人的简历和目标职位描述，生成个性化的面试准备材料。

**重要原则**：
1. 所有问题的参考答案必须基于候选人的真实经历，不要虚构
2. 使用STAR法则（情境-任务-行动-结果）组织行为问题的答案
3. 技术问题要结合候选人的实际技术栈
4. 答案要简洁有力，突出亮点和量化成果
5. 反问问题要体现候选人对职位的深入思考

**输出格式**：严格返回JSON格式，包含以下字段：
{
  "common_questions": [
    {
      "question": "问题内容",
      "answer": "基于候选人真实经历的参考答案",
      "type": "common",
      "tips": "回答技巧（可选）"
    }
  ],
  "technical_questions": [
    {
      "question": "技术问题",
      "answer": "答题思路和关键点",
      "type": "technical"
    }
  ],
  "behavioral_questions": [
    {
      "question": "行为问题",
      "answer": "STAR格式的参考答案",
      "type": "behavioral"
    }
  ],
  "reverse_questions": [
    "反问问题1",
    "反问问题2"
  ],
  "company_background": "公司背景速查（100字以内）"
}`;

    const userPrompt = `请为以下候选人生成面试准备材料：

**目标职位**：
公司：${jobDescription.company_name}
职位：${jobDescription.job_title}
职位描述：${jobDescription.raw_text.substring(0, 1000)}

**职位分析**：
- 关键词：${jobAnalysis.keywords.join(', ')}
- 核心要求：${jobAnalysis.requirements.slice(0, 5).join('; ')}
- 职责：${jobAnalysis.responsibilities.slice(0, 3).join('; ')}
- 级别：${jobAnalysis.seniority_level}
- 行业：${jobAnalysis.industry}

**候选人简历摘要**：
姓名：${resumeContent.header.name}
职位：${resumeContent.header.job_title || resumeContent.header.title}
个人简介：${resumeContent.summary}

工作经历：
${experienceSummary}

项目经验：
${projectSummary}

技能：
${skillsSummary}

**生成要求**：
1. 生成10个常见问题（自我介绍、离职原因、职业规划、优缺点、薪资期望等）
2. 生成5个技术问题（基于职位要求的技术栈）
3. 生成3个行为问题（团队协作、解决冲突、项目挑战等）
4. 生成5个反问问题（问HR或技术面试官）
5. 生成公司背景速查（100字）

所有答案必须基于候选人的真实经历，使用第一人称。`;

    // 调用 DeepSeek API
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API 错误:", errorText);
      return new Response(
        JSON.stringify({ error: "AI 生成失败", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AI 返回内容为空" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 解析 JSON
    let interviewPack;
    try {
      // 尝试提取 JSON（可能包含在 markdown 代码块中）
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      interviewPack = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON 解析失败:", e, "原始内容:", content);
      return new Response(
        JSON.stringify({ error: "AI 返回格式错误", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify(interviewPack),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("生成面试包失败:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
