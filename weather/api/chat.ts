export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;

  res.status(200).json({
    message: "API key exists",
    hasKey: !!apiKey,
  });
}