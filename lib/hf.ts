// Hugging Face Inference API — DeepSeek-R1-Distill-Llama-8B

const HF_MODEL = 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B';
const HF_BASE  = 'https://api-inference.huggingface.co';

export type HFMessage = { role: 'user' | 'assistant' | 'system'; content: string };

type HFChatResponse = {
  choices?: Array<{ message?: { role: string; content: string } }>;
  error?: string;
  estimated_time?: number;
};

type HFTextResponse = Array<{ generated_text?: string }> | { error?: string; estimated_time?: number };

function getToken() {
  const t = process.env.HF_TOKEN;
  if (!t) throw new Error('HF_TOKEN тохируулагдаагүй байна');
  return t;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function stripThink(text: string) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

// Chat completions API with auto-retry on model loading (503)
export async function hfChat(
  messages: HFMessage[],
  opts: { max_tokens?: number; temperature?: number } = {}
): Promise<string> {
  const token = getToken();

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${HF_BASE}/models/${HF_MODEL}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: HF_MODEL,
        messages,
        max_tokens:  opts.max_tokens  ?? 1024,
        temperature: opts.temperature ?? 0.7,
        stream: false,
      }),
    });

    // Model still loading — wait and retry
    if (res.status === 503) {
      if (attempt < 2) {
        await sleep(4000 + attempt * 2000);
        continue;
      }
      // After 3 tries, fall back to text-gen endpoint
      return hfTextGeneration(messages, opts);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => `HTTP ${res.status}`);
      // If JSON error body with loading info
      try {
        const j = JSON.parse(body) as { error?: string; estimated_time?: number };
        if (j.estimated_time && attempt < 2) {
          await sleep(Math.min(j.estimated_time * 1000, 8000));
          continue;
        }
        if (j.error) throw new Error(`DeepSeek: ${j.error}`);
      } catch { /* not JSON */ }
      throw new Error(`HuggingFace ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json() as HFChatResponse;

    if (data.error) {
      if (data.estimated_time && attempt < 2) {
        await sleep(Math.min(data.estimated_time * 1000, 8000));
        continue;
      }
      // Fall back to text generation
      return hfTextGeneration(messages, opts);
    }

    const content = data.choices?.[0]?.message?.content ?? '';
    return stripThink(content);
  }

  return hfTextGeneration(messages, opts);
}

// Text generation fallback — builds a prompt string from messages
async function hfTextGeneration(
  messages: HFMessage[],
  opts: { max_tokens?: number; temperature?: number } = {}
): Promise<string> {
  const token = getToken();

  const prompt = messages.map(m => {
    if (m.role === 'system') return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${m.content}<|eot_id|>`;
    if (m.role === 'user')   return `<|start_header_id|>user<|end_header_id|>\n${m.content}<|eot_id|>`;
    return `<|start_header_id|>assistant<|end_header_id|>\n${m.content}<|eot_id|>`;
  }).join('') + '<|start_header_id|>assistant<|end_header_id|>\n';

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${HF_BASE}/models/${HF_MODEL}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens:  opts.max_tokens  ?? 1024,
          temperature:     opts.temperature ?? 0.7,
          return_full_text: false,
          stop: ['<|eot_id|>', '<|end_of_text|>'],
        },
        options: { wait_for_model: true },
      }),
    });

    if (res.status === 503) {
      if (attempt < 2) { await sleep(5000 + attempt * 3000); continue; }
      throw new Error('DeepSeek загвар ачаалагдаж байна. 30 секунд хүлээгээд дахин оролдоно уу.');
    }

    if (!res.ok) {
      const body = await res.text().catch(() => `HTTP ${res.status}`);
      try {
        const j = JSON.parse(body) as { error?: string; estimated_time?: number };
        if (j.estimated_time && attempt < 2) { await sleep(Math.min(j.estimated_time * 1000, 10000)); continue; }
        if (j.error) throw new Error(`DeepSeek: ${j.error}`);
      } catch { /* not JSON */ }
      throw new Error(`HuggingFace ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json() as HFTextResponse;

    if (!Array.isArray(data)) {
      if (data.estimated_time && attempt < 2) {
        await sleep(Math.min(data.estimated_time * 1000, 10000));
        continue;
      }
      throw new Error(data.error ?? 'HF inference failed');
    }

    return stripThink(data[0]?.generated_text ?? '');
  }

  throw new Error('DeepSeek загвар ачаалагдаж байна. Хэсэг хугацаа хүлээгээд дахин оролдоно уу.');
}
