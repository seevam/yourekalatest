import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, skinScans, skinProfiles } from '@/lib/schema'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a professional dermatology AI assistant. Analyze the provided facial photo and assess the person's skin condition. Be accurate, clinical, and constructive. Focus only on observable skin characteristics — never comment on attractiveness or non-skin features.

Return ONLY a valid JSON object with this exact shape:
{
  "skinType": "oily" | "dry" | "combination" | "sensitive",
  "concerns": string[],
  "hydrationLevel": "low" | "medium" | "high",
  "oilinessLevel": "low" | "medium" | "high",
  "overallScore": number (0–100),
  "summary": string (2–3 sentences describing observable skin condition),
  "recommendations": string[] (3–4 specific actionable skincare tips)
}

For concerns, use terms from this list where applicable:
acne, blackheads, whiteheads, dark spots, hyperpigmentation, redness, dryness, oiliness, large pores, uneven texture, fine lines, dullness, under-eye circles, sensitivity.

If the image does not show a clear face or skin, return:
{ "error": "Unable to analyze — please provide a clear, well-lit photo of your face." }`

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { image, mediaType } = await req.json() as {
    image: string        // base64
    mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
  }

  if (!image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  // Call Claude vision
  let analysis: Record<string, unknown>
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image },
            },
            { type: 'text', text: 'Please analyze my skin.' },
          ],
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    analysis = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Analysis failed — please try again.' }, { status: 500 })
  }

  if ('error' in analysis) {
    return NextResponse.json({ error: analysis.error }, { status: 422 })
  }

  // Resolve internal user ID
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Save scan
  await db.insert(skinScans).values({ userId: user.id, analysis })

  // Auto-update skin profile with detected skin type if no profile exists
  const [existing] = await db
    .select({ id: skinProfiles.id })
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, user.id))
    .limit(1)

  if (!existing && analysis.skinType) {
    await db.insert(skinProfiles).values({
      userId: user.id,
      skinType: analysis.skinType as string,
      skinConcerns: (analysis.concerns as string[]) ?? [],
    })
  }

  return NextResponse.json({ analysis })
}
