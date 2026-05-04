import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MasterProfile {
  profile: {
    full_name: string;
    professional_title: string;
    summary: string;
  } | null;
  skills: Array<{ name: string; category: string }>;
  workExperience: Array<{
    company: string;
    role: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field_of_study: string;
  }>;
  projects: Array<{ name: string; description: string; tech_stack: string[] }>;
  certifications: Array<{ name: string; issuer: string }>;
}

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

    const { jobText, profile }: { jobText: string; profile: MasterProfile } = await req.json();

    if (!jobText || !profile) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const skillNames = profile.skills.map((s) => s.name).join("、");
    const expSummary = profile.workExperience
      .slice(0, 3)
      .map((e) => `${e.role} @ ${e.company}`)
      .join("；");

    const systemPrompt = `你是一位专业的简历顾问和职位匹配专家。你的任务是分析职位描述（JD），并与候选人的职业档案进行匹配分析。请严格按照指定的 JSON 格式返回结果，不要添加任何额外文字或 markdown 代码块。`;

    const userPrompt = `请分析以下职位描述，并与候选人档案进行匹配。

## 候选人档案
- 当前职位：${profile.profile?.professional_title || "未填写"}
- 技能：${skillNames || "暂未填写"}
- 工作经历：${expSummary || "暂未填写"}

## 职位描述
${jobText}

## 返回格式（严格 JSON，不要有其他内容）
{
  "keywords": ["关键词1", "关键词2", ...],
  "requirements": ["岗位要求1", "岗位要求2", ...],
  "responsibilities": ["工作职责1", "工作职责2", ...],
  "ats_terms": ["ATS术语1", "ATS术语2", ...],
  "match_score": 75,
  "gaps": ["技能缺口1", "技能缺口2"],
  "matched_skills": ["已匹配技能1", "已匹配技能2"],
  "seniority_level": "Senior",
  "industry": "互联网"
}

## 规则
- keywords：从JD中提取8-12个最重要的技术和能力关键词
- requirements：提取5条最核心的岗位要求（直接从JD原文提取或精炼）
- responsibilities：提取5条最核心的工作职责（直接从JD原文提取或精炼）
- ats_terms：提取6-8个适合放入简历的ATS优化关键词
- match_score：0-100的整数，基于候选人技能与JD要求的匹配程度
- gaps：候选人档案中缺少但JD要求的技能（最多4条，如无缺口则返回空数组）
- matched_skills：候选人已具备且与JD匹配的技能（从候选人技能列表中选取）
- seniority_level：职位级别（Junior/Mid-level/Senior/Staff/Principal 之一）
- industry：行业领域（中文，如"互联网"、"金融科技"、"人工智能"等）`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
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
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `DeepSeek API 调用失败: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "DeepSeek 返回内容为空" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = JSON.parse(content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `服务器内部错误: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
