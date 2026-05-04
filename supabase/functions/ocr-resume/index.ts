import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "未授权" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "用户验证失败" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { storagePath } = await req.json();
    if (!storagePath) {
      return new Response(
        JSON.stringify({ error: "缺少 storagePath 参数" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: fileData, error: fileError } = await supabase
      .storage
      .from("resume-uploads")
      .download(storagePath);

    if (fileError || !fileData) {
      return new Response(
        JSON.stringify({ error: `文件下载失败: ${fileError?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = fileData.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const systemPrompt = `你是一位专业的简历解析专家。请从简历图片中提取所有结构化信息，严格按照指定 JSON 格式返回，不要添加任何额外文字或 markdown 代码块。如果某个字段无法识别，返回空字符串或空数组。`;

    const userPrompt = `请仔细阅读这份简历图片，提取所有信息并按以下 JSON 格式返回：

{
  "basic": {
    "full_name": "姓名",
    "professional_title": "职位头衔",
    "email": "邮箱",
    "phone": "手机号",
    "location": "城市/地址",
    "website": "个人网站URL",
    "linkedin": "LinkedIn URL或用户名",
    "github": "GitHub URL或用户名",
    "summary": "个人简介/自我描述"
  },
  "experience": [
    {
      "company": "公司名称",
      "role": "职位名称",
      "location": "工作地点",
      "start_date": "开始时间（格式YYYY-MM）",
      "end_date": "结束时间（格式YYYY-MM，如在职则为空）",
      "is_current": false,
      "bullets": ["工作职责或成就1", "工作职责或成就2"]
    }
  ],
  "education": [
    {
      "institution": "学校名称",
      "degree": "学位",
      "field_of_study": "专业",
      "start_date": "入学时间（格式YYYY-MM）",
      "end_date": "毕业时间（格式YYYY-MM）",
      "gpa": "GPA（如有）",
      "activities": "课外活动（如有）"
    }
  ],
  "skills": [
    { "name": "技能名称", "category": "分类（Languages/Frontend/Backend/Tools等）", "proficiency": "熟练程度（Beginner/Intermediate/Advanced/Expert）" }
  ],
  "projects": [
    {
      "name": "项目名称",
      "description": "项目描述",
      "tech_stack": ["技术1", "技术2"],
      "live_url": "",
      "repo_url": "",
      "start_date": "",
      "end_date": "",
      "highlights": ["项目亮点1", "项目亮点2"]
    }
  ],
  "certifications": [
    {
      "name": "证书名称",
      "issuer": "颁发机构",
      "issue_date": "颁发日期（格式YYYY-MM）",
      "expiry_date": "",
      "credential_id": "",
      "credential_url": ""
    }
  ]
}`;

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
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: userPrompt },
            ],
          },
        ],
        temperature: 0.1,
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

    const parsed = JSON.parse(content);

    await supabase.storage.from("resume-uploads").remove([storagePath]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `服务器内部错误: ${(err as Error).message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
