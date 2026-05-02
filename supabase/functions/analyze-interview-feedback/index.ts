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

    const { questions, companyName, interviewType, jobTitle } = await req.json();

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: "缺少面试问题" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = `你是一位资深面试教练，擅长分析面试表现并给出改进建议。

你的任务是：
1. 评估每个问题的回答质量（1-5分）
2. 指出回答中的优点和不足
3. 给出具体的改进建议
4. 识别高频问题类型
5. 总结下次面试的注意事项

**评分标准**：
- 5分：回答完整、结构清晰、有具体案例和量化成果
- 4分：回答较好，但缺少部分细节或量化数据
- 3分：回答基本合格，但不够深入或结构松散
- 2分：回答不完整，缺少关键信息
- 1分：回答偏题或完全不合格

**输出格式**：严格返回JSON格式：
{
  "question_analysis": [
    {
      "question": "问题内容",
      "rating": 3,
      "strengths": ["优点1", "优点2"],
      "weaknesses": ["不足1", "不足2"],
      "improvement": "具体改进建议"
    }
  ],
  "overall_improvements": [
    "总体改进建议1",
    "总体改进建议2"
  ],
  "high_frequency_topics": [
    "高频话题1",
    "高频话题2"
  ],
  "next_interview_tips": [
    "下次面试注意事项1",
    "下次面试注意事项2"
  ]
}`;

    const questionsText = questions
      .map((q: any, i: number) => `
问题 ${i + 1}：${q.question}
我的回答：${q.my_answer || '（未回答）'}
面试官反馈：${q.feedback || '（无）'}
自我评分：${q.rating || '未评分'}
`)
      .join('\n---\n');

    const userPrompt = `请分析以下面试表现：

**面试信息**：
公司：${companyName}
职位：${jobTitle || '未知'}
面试类型：${interviewType}

**面试问题和回答**：
${questionsText}

请给出详细的分析和改进建议。`;

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
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API 错误:", errorText);
      return new Response(
        JSON.stringify({ error: "AI 分析失败", details: errorText }),
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
    let analysis;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysis = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON 解析失败:", e, "原始内容:", content);
      return new Response(
        JSON.stringify({ error: "AI 返回格式错误", raw: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 提取改进建议
    const improvements = analysis.overall_improvements || [];

    return new Response(
      JSON.stringify({ analysis, improvements }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("分析面试反馈失败:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
