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

    const { profile, analysis, jobText, jobTitle, templateStyleDescription } = await req.json();
    if (!profile || !analysis) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const p = profile.profile;
    const expJson = JSON.stringify(profile.workExperience?.slice(0, 4) ?? []);
    const projJson = JSON.stringify(profile.projects?.slice(0, 3) ?? []);
    const skillsJson = JSON.stringify(profile.skills ?? []);
    const eduJson = JSON.stringify(profile.education ?? []);
    const certJson = JSON.stringify(profile.certifications ?? []);
    const campusJson = JSON.stringify(profile.campusActivities?.slice(0, 4) ?? []);

    const templateStyleNote = templateStyleDescription
      ? `\n7. 【排版风格要求】请严格按照以下模版风格描述来组织内容结构和措辞，使生成结果在渲染时能还原该风格：${templateStyleDescription}`
      : "";

    const systemPrompt = `你是一位在顶级咨询公司和猎头机构有20年经验的资深简历撰写大师，擅长为中国求职者打造针对特定岗位的高通过率简历。你的简历风格：
1. 每一条工作经历都使用 STAR 法则改写，量化成就，突出与 JD 直接相关的关键词
2. 开头必须有核心能力关键词区（4-6个词，格式如："新媒体运营 | 私域增长 | 数据分析"）
3. 工作摘要精炼有力，直接匹配岗位要求，使用岗位 JD 中的核心词汇
4. 每条 bullet 必须用【成就动词 + 关键词 + 数据/结果】结构
5. 技能分类清晰，优先展示与 JD 匹配的技能
6. 严格输出 JSON，不添加任何 markdown 或说明文字${templateStyleNote}`;

    const userPrompt = `请根据以下岗位描述，将候选人的档案改写为一份高度定制化的简历。

## 目标岗位 JD
${jobText || "职位描述：" + analysis.requirements?.join("；")}

## 岗位关键信息
- 目标职位名称：${jobTitle || "未提供"}
- 职位关键词：${analysis.keywords?.join("、")}
- 核心要求：${analysis.requirements?.join("；")}
- 已匹配技能：${analysis.matched_skills?.join("、")}
- 行业：${analysis.industry}
- 级别：${analysis.seniority_level}

## 候选人原始档案
- 姓名：${p?.full_name || ""}
- 当前职位：${p?.professional_title || ""}
- 原始简介：${p?.summary || ""}

### 工作经历（原始）
${expJson}

### 项目经历（原始）
${projJson}

### 技能
${skillsJson}

### 教育背景
${eduJson}

### 证书
${certJson}

### 校园经历（原始）
${campusJson}

## 输出格式（严格 JSON）
{
  "core_keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
  "summary": "3-4句话的专业摘要，融入JD关键词，展示候选人价值主张，中文",
  "experience": [
    {
      "id": "原id",
      "company": "公司名",
      "role": "职位名",
      "location": "地点",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "is_current": false,
      "bullets": [
        "用STAR法则改写的成就句，必须包含数据，与JD关键词强相关（中文）",
        "..."
      ]
    }
  ],
  "projects": [
    {
      "id": "原id",
      "name": "项目名",
      "description": "一句话描述项目价值，融入JD关键词",
      "tech_stack": ["技术栈"],
      "live_url": "",
      "repo_url": "",
      "highlights": ["量化成就1", "量化成就2"]
    }
  ],
  "campusActivities": [
    {
      "id": "原id",
      "organization": "组织/社团/赛事名称",
      "role": "担任角色",
      "activity_type": "活动类型",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "is_current": false,
      "description": "一句话概括校园经历价值",
      "highlights": ["量化成果1", "量化成果2"]
    }
  ],
  "skills": [
    { "category": "核心能力", "items": ["与JD最匹配的技能优先"] },
    { "category": "工具 & 平台", "items": ["相关工具"] }
  ],
  "education": [
    {
      "id": "原id",
      "institution": "学校",
      "degree": "学位",
      "field_of_study": "专业",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "gpa": ""
    }
  ],
  "certifications": [
    {
      "id": "原id",
      "name": "证书名",
      "issuer": "颁发机构",
      "issue_date": "YYYY-MM"
    }
  ]
}

## 要求
- bullets 每条必须以强动词开头（负责/主导/推动/优化/搭建/实现等）
- bullets 中必须有数字/百分比等量化数据
- bullets 中必须植入至少1个 JD 关键词
- 每段工作经历保留3-5条 bullets（不是原样复制，必须重新改写）
- skills 只保留2-4个分类，每类3-8个技能
- campusActivities 保留与目标岗位相关的校园经历，每段保留2-4条 highlights；如没有相关内容可返回空数组
- summary 必须体现候选人最突出的3个优势 + 岗位关联`;

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
        temperature: 0.4,
        max_tokens: 4000,
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

    const generated = JSON.parse(content);

       const header = {
      name: p?.full_name || "",
      title: p?.professional_title || "",
      job_title: jobTitle || "",
      email: p?.email || "",
      phone: p?.phone || "",
      location: p?.location || "",
      linkedin: p?.linkedin || "",
      github: p?.github || "",
      website: p?.website || "",
      avatar_url: p?.avatar_url || "",
    };

    return new Response(
      JSON.stringify({
        ...generated,
        header: {
          ...(generated.header ?? {}),
          ...header,
        },
      }),

      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `服务器内部错误: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
