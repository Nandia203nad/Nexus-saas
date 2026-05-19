import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, ImageBlockParam, TextBlockParam } from '@anthropic-ai/sdk/resources/messages';
import { hfChat, type HFMessage } from '@/lib/hf';
import { optionalAuth } from '@/lib/auth';
import { handleError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are NexusAI, an expert assistant for the Nexus content platform. You help users with:
- Content creation, blog writing, and marketing strategy
- SEO optimization and analytics
- Image and video analysis
- Coding, AI tools, and technology
- Any question the user asks

Be helpful, concise, and provide actionable insights. Respond in the same language the user writes in.`;

export async function POST(req: NextRequest) {
  try {
    const u = optionalAuth(req);
    const userId = u?.userId || 'guest';
    const { action, payload } = await req.json();

    // ── General chat: answer any question ─────────────────────────────────
    if (action === 'chat') {
      const client = getClient();
      const rawMessages = (payload?.messages || []) as Array<{ role: string; content: string }>;

      const messages: MessageParam[] = rawMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      if (!messages.length) return NextResponse.json({ message: 'Messages required' }, { status: 400 });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
      });

      const reply = response.content[0].type === 'text' ? response.content[0].text : '';
      return NextResponse.json({ success: true, agent: 'NexusAI v2.0', userId: userId, action: 'CHAT', result: { reply } });
    }

    // ── Image analysis ─────────────────────────────────────────────────────
    if (action === 'analyze_image') {
      const client = getClient();
      const { imageBase64, mediaType, question } = payload || {};
      if (!imageBase64) return NextResponse.json({ message: 'Image data required' }, { status: 400 });

      const imgBlock: ImageBlockParam = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: (mediaType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: imageBase64,
        },
      };
      const txtBlock: TextBlockParam = {
        type: 'text',
        text: question || 'Describe this image in detail. What do you see? Provide insights and observations.',
      };

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: [imgBlock, txtBlock] }],
      });

      const analysis = response.content[0].type === 'text' ? response.content[0].text : '';
      return NextResponse.json({ success: true, agent: 'NexusAI v2.0', userId: userId, action: 'ANALYZE_IMAGE', result: { analysis } });
    }

    // ── Video analysis ─────────────────────────────────────────────────────
    if (action === 'analyze_video') {
      const client = getClient();
      const { videoUrl, thumbnailBase64, thumbnailType, question } = payload || {};

      let msgContent: MessageParam['content'];

      if (thumbnailBase64) {
        const imgBlock: ImageBlockParam = {
          type: 'image',
          source: {
            type: 'base64',
            media_type: (thumbnailType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: thumbnailBase64,
          },
        };
        const txtBlock: TextBlockParam = {
          type: 'text',
          text: `This is a thumbnail/frame from a video${videoUrl ? ` at: ${videoUrl}` : ''}.\n${question || 'Analyze the video content, describe what you see, and provide insights about the topic, target audience, and quality.'}`,
        };
        msgContent = [imgBlock, txtBlock];
      } else {
        msgContent = `Analyze this video: ${videoUrl || 'No URL provided'}\n\n${question || 'What can you tell me about this video? Provide analysis of the content topic, potential audience, SEO potential, and key insights.'}`;
      }

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: msgContent }],
      });

      const analysis = response.content[0].type === 'text' ? response.content[0].text : '';
      return NextResponse.json({ success: true, agent: 'NexusAI v2.0', userId: userId, action: 'ANALYZE_VIDEO', result: { analysis } });
    }

    // ── Generate blog draft ───────────────────────────────────────────────
    if (action === 'generate_draft') {
      const client = getClient();
      const topic = payload?.topic || 'Content marketing';

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Create a compelling blog post draft about: "${topic}"\n\nRespond with JSON only:\n{"title":"...","excerpt":"2-3 sentence teaser","outline":["point 1","point 2","point 3","point 4","point 5"],"content":"full introduction paragraph"}`,
        }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      let result;
      try {
        const m = text.match(/\{[\s\S]*\}/);
        result = m ? JSON.parse(m[0]) : { title: topic, excerpt: '', outline: [], content: text };
      } catch {
        result = { title: topic, excerpt: text.slice(0, 150), outline: [], content: text };
      }
      return NextResponse.json({ success: true, agent: 'NexusAI v2.0', userId: userId, action: 'GENERATE_DRAFT', result });
    }

    // ── Recommend topics ──────────────────────────────────────────────────
    if (action === 'recommend') {
      const client = getClient();
      const level = payload?.level || 1;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `For a content creator at level ${level} (1-3=beginner, 4-7=intermediate, 8+=expert), recommend 3 specific blog topics. Respond with JSON only: {"topics":["topic1","topic2","topic3"],"message":"brief explanation"}`,
        }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      let result;
      try {
        const m = text.match(/\{[\s\S]*\}/);
        result = m ? JSON.parse(m[0]) : { topics: [], message: text };
      } catch {
        result = { topics: [], message: text };
      }
      return NextResponse.json({ success: true, agent: 'NexusAI v2.0', userId: userId, action: 'RECOMMEND', result });
    }

    // ── Analyze content ───────────────────────────────────────────────────
    if (action === 'analyze') {
      const client = getClient();
      const text = payload?.text || '';
      if (!text.trim()) return NextResponse.json({ message: 'Text required' }, { status: 400 });

      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const readTime = Math.ceil(wordCount / 200);

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Analyze this content for SEO and quality:\n\n"${text.slice(0, 2000)}"\n\nRespond with JSON only: {"seoScore":0-100,"sentiment":"brief description","suggestions":["s1","s2","s3"]}`,
        }],
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '{}';
      let aiResult;
      try {
        const m = responseText.match(/\{[\s\S]*\}/);
        aiResult = m ? JSON.parse(m[0]) : { seoScore: 50, sentiment: 'Neutral', suggestions: [] };
      } catch {
        aiResult = { seoScore: 50, sentiment: 'Neutral', suggestions: [] };
      }
      return NextResponse.json({ success: true, agent: 'NexusAI v2.0', userId: userId, action: 'ANALYZE', result: { wordCount, readTime, ...aiResult } });
    }

    // ── DeepSeek-R1 chat via Hugging Face ────────────────────────────────
    if (action === 'deepseek') {
      const rawMessages = (payload?.messages || []) as Array<{ role: string; content: string }>;
      if (!rawMessages.length) return NextResponse.json({ message: 'Messages required' }, { status: 400 });

      const messages: HFMessage[] = [
        {
          role: 'system',
          content: 'You are DeepSeek-R1, a powerful reasoning AI assistant. Think step-by-step and provide accurate, detailed answers. Respond in the same language the user writes in.',
        },
        ...rawMessages.map(m => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as HFMessage['role'],
          content: m.content,
        })),
      ];

      const reply = await hfChat(messages, { max_tokens: 1024, temperature: 0.6 });
      return NextResponse.json({ success: true, agent: 'DeepSeek-R1', userId, action: 'DEEPSEEK', result: { reply } });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[AI API Error]:', error);
    // Surface descriptive Anthropic API errors instead of generic message
    if (error instanceof Anthropic.APIError) {
      const msg =
        error.status === 401 ? 'AI API түлхүүр буруу эсвэл хүчингүй байна. .env дахь ANTHROPIC_API_KEY-г шалгана уу.' :
        error.status === 403 ? 'AI API хандах эрхгүй байна.' :
        error.status === 404 ? `AI загвар олдсонгүй: ${error.message}` :
        error.status === 429 ? 'AI хэт их хүсэлт илгээсэн. Хэсэг хугацаа хүлээнэ үү.' :
        error.status === 529 ? 'Anthropic сервер хэт ачаалалтай байна. Дахин оролдоно уу.' :
        `AI алдаа (${error.status}): ${error.message}`;
      return NextResponse.json({ message: msg }, { status: error.status ?? 500 });
    }
    if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json({ message: 'ANTHROPIC_API_KEY тохируулагдаагүй байна.' }, { status: 500 });
    }
    const e = handleError(error);
    return NextResponse.json({ message: e.message }, { status: e.status });
  }
}
