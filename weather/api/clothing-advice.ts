import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { label, max, min, current } = req.body;

    const prompt =
      `今日の天気は「${label}」、最高気温${max}℃、` +
      `最低気温${min}℃、現在${current}℃です。` +
      `この天気にぴったりの服装を提案してください。\n` +
      `以下のJSON形式のみで出力してください（前後の説明文は不要）:\n` +
      `{"outfit": "服装の組み合わせを15文字以内で。例: 長袖 ＋ ジャケット", ` +
      `"message": "そのアドバイス理由を20文字程度で。例: 軽めのアウターが必要です"}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "あなたは天気に詳しいファッションアドバイザーです。" +
            "気温・天気から最適な服装を簡潔にJSONで提案してください。",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
    });

    const text = response.choices[0].message.content?.trim() ?? "{}";
    const parsed = JSON.parse(text);

    return res.status(200).json({
      outfit: parsed.outfit ?? "服装提案を取得できませんでした",
      message: parsed.message ?? "",
    });
  } catch (e) {
    return res.status(500).json({
      error:
        e instanceof Error
          ? e.message
          : "AI服装アドバイスの生成に失敗しました",
    });
  }
}