// Hugging Face Inference API — DeepSeek-R1-Distill-Llama-8B

const HF_MODEL = 'deepseek-ai/DeepSeek-R1-Distill-Llama-8B';
const HF_BASE  = 'https://api-inference.huggingface.co';

export type HFMessage = { role: 'user' | 'assistant' | 'system'; content: string };

type HFChatChoice = {
  message?: { role: string; content: string };
  text?: string;
};

type HFChatResponse = {
  choices?: HFChatChoice[];
  error?: string;
  estimated_time?: number;
};

type HFTextResponse = Array<{ generated_text?: string }> | { error?: string; estimated_time?: number };

function getToken() {
  const t = process.env.HF_TOKEN;
  if (!t) throw new Error('HF_TOKEN is not configured');
  return t;
}

// Chat completions API (OpenAI-compatible) — preferred for instruct models
export async function hfChat(
  messages: HFMessage[],
  opts: { max_tokens?: number; temperature?: number } = {}
): Promise<string> {
  const token = getToken();
  const res = await fetch(`${HF_BASE}/models/${HF_MODEL}/v1/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: HF_MODEL,
      messages,
      max_tokens:  opts.max_tokens  ?? 1024,
      temperature: opts.temperature ?? 0.6,
      stream: false,
    }),
  });

  if (res.status === 503) {
    // Model is loading — fall back to text generation endpoint
    return hfTextGeneration(messages, opts);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`HuggingFace error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json() as HFChatResponse;
  if (data.error) {
    if (data.estimated_time) {
      throw new Error(`DeepSeek model is loading (~${Math.ceil(data.estimated_time)}s). Try again shortly.`);
    }
    // Fall back to text generation
    return hfTextGeneration(messages, opts);
  }

  const content = data.choices?.[0]?.message?.content ?? '';
  // Strip <think>...</think> reasoning blocks from output for cleaner UX
  return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

// Text generation fallback — wraps messages into a prompt string
async function hfTextGeneration(
  messages: HFMessage[],
  opts: { max_tokens?: number; temperature?: number } = {}
): Promise<string> {
  const token = getToken();

  // Build Llama-3 / DeepSeek chat template
  const prompt = messages.map(m => {
    if (m.role === 'system') return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${m.content}<|eot_id|>`;
    if (m.role === 'user')   return `<|start_header_id|>user<|end_header_id|>\n${m.content}<|eot_id|>`;
    return `<|start_header_id|>assistant<|end_header_id|>\n${m.content}<|eot_id|>`;
  }).join('') + '<|start_header_id|>assistant<|end_header_id|>\n';

  const res = await fetch(`${HF_BASE}/models/${HF_MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens:  opts.max_tokens  ?? 1024,
        temperature:     opts.temperature ?? 0.6,
        return_full_text: false,
        stop: ['<|eot_id|>', '<|end_of_text|>'],
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`HuggingFace error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json() as HFTextResponse;

  if (!Array.isArray(data)) {
    if (data.estimated_time) {
      throw new Error(`DeepSeek model is loading (~${Math.ceil(data.estimated_time)}s). Try again shortly.`);
    }
    throw new Error(data.error ?? 'HF inference failed');
  }

  const text = data[0]?.generated_text ?? '';
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}
