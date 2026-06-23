import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, skinProfiles } from '@/lib/schema'

interface Tip {
  title: string
  body: string
}

interface TipCategory {
  category: string
  tips: Tip[]
}

const TIPS: Record<string, TipCategory[]> = {
  oily: [
    {
      category: 'Morning Routine',
      tips: [
        { title: 'Foaming cleanser', body: 'Start with a gentle foaming or gel cleanser to remove overnight sebum without stripping moisture.' },
        { title: 'Skip heavy moisturisers', body: 'Use a lightweight, oil-free gel moisturiser — your skin needs hydration even if it feels oily.' },
        { title: 'SPF daily', body: 'Use a mattifying SPF 30+ every morning. Sun damage worsens oily skin over time.' },
      ],
    },
    {
      category: 'Evening Routine',
      tips: [
        { title: 'Double cleanse', body: 'Use a micellar water first, then your foaming cleanser to fully remove sunscreen and buildup.' },
        { title: 'Niacinamide serum', body: 'Apply a 5–10% niacinamide serum to regulate oil production and minimise pores.' },
        { title: 'Lightweight moisturiser', body: 'Finish with a water-based gel moisturiser — skipping it causes your skin to overproduce oil.' },
      ],
    },
    {
      category: 'Weekly Care',
      tips: [
        { title: 'BHA exfoliant', body: 'Use salicylic acid (BHA) 2–3 times a week to keep pores clear and reduce breakouts.' },
        { title: 'Clay mask', body: 'A kaolin or bentonite clay mask once a week absorbs excess sebum without irritation.' },
      ],
    },
    {
      category: 'Ingredients to Look For',
      tips: [
        { title: 'Salicylic acid', body: 'Oil-soluble, penetrates pores to clear congestion and reduce acne.' },
        { title: 'Niacinamide', body: 'Regulates sebum production and reduces the appearance of pores.' },
        { title: 'Zinc', body: 'Helps control oil and has mild anti-inflammatory properties.' },
      ],
    },
    {
      category: 'Ingredients to Avoid',
      tips: [
        { title: 'Heavy oils', body: 'Avoid coconut oil, cocoa butter, and mineral oil — they can clog pores on oily skin.' },
        { title: 'Alcohol-heavy toners', body: 'Harsh alcohols strip the skin barrier, causing a rebound increase in oil production.' },
      ],
    },
  ],

  dry: [
    {
      category: 'Morning Routine',
      tips: [
        { title: 'Cream cleanser', body: 'Use a hydrating, non-foaming cleanser — foaming cleansers strip the limited moisture dry skin has.' },
        { title: 'Hyaluronic acid on damp skin', body: 'Apply HA serum immediately after washing while skin is still slightly damp to lock in moisture.' },
        { title: 'Rich SPF moisturiser', body: 'Use a moisturising SPF or layer a hydrating moisturiser under your sunscreen.' },
      ],
    },
    {
      category: 'Evening Routine',
      tips: [
        { title: 'Oil cleanse', body: 'An oil or balm cleanser removes makeup and SPF without disturbing the skin barrier.' },
        { title: 'Layer hydration', body: 'Use a hydrating toner, then serum, then cream — each layer adds moisture and helps the next absorb better.' },
        { title: 'Occlusive to seal', body: 'Finish with a small amount of Vaseline or a rich balm to prevent transepidermal water loss overnight.' },
      ],
    },
    {
      category: 'Weekly Care',
      tips: [
        { title: 'Gentle AHA exfoliant', body: 'Use lactic acid (AHA) 1–2 times a week to gently remove dry flakes and boost hydration absorption.' },
        { title: 'Hydrating mask', body: 'A hyaluronic acid or aloe-based mask once a week gives an extra boost of moisture.' },
      ],
    },
    {
      category: 'Ingredients to Look For',
      tips: [
        { title: 'Hyaluronic acid', body: 'Draws water into the skin and holds up to 1000x its weight in moisture.' },
        { title: 'Ceramides', body: 'Repair and reinforce the skin barrier, reducing moisture loss.' },
        { title: 'Glycerin & squalane', body: 'Humectant and emollient combo that keeps skin supple and soft.' },
      ],
    },
    {
      category: 'Ingredients to Avoid',
      tips: [
        { title: 'Fragrance', body: 'Fragrance is a common irritant that further compromises an already-weakened skin barrier.' },
        { title: 'Retinoids (start slow)', body: 'If using retinol, start very low (0.025%) and always layer over moisturiser to avoid dryness.' },
      ],
    },
  ],

  combination: [
    {
      category: 'Morning Routine',
      tips: [
        { title: 'Balanced cleanser', body: 'A gentle, low-foam cleanser cleans the T-zone without drying out your cheeks.' },
        { title: 'Lightweight moisturiser', body: 'A gel-cream hybrid hydrates dry areas without adding shine to oily zones.' },
        { title: 'SPF daily', body: 'A fluid SPF works across both oily and dry zones without looking greasy or patchy.' },
      ],
    },
    {
      category: 'Evening Routine',
      tips: [
        { title: 'Niacinamide serum', body: 'Balances oil on the T-zone while providing light hydration to the cheeks.' },
        { title: 'Multi-masking', body: 'Use a clay mask on the T-zone and a hydrating mask on your cheeks simultaneously.' },
        { title: 'Gel-cream moisturiser', body: 'A water-based gel-cream is the sweet spot for combination skin at night.' },
      ],
    },
    {
      category: 'Weekly Care',
      tips: [
        { title: 'BHA on T-zone', body: 'Apply a salicylic acid product only to the nose and forehead 2x per week.' },
        { title: 'Hydrating mask on cheeks', body: 'Spot-treat dry cheeks with a hyaluronic acid sheet mask once a week.' },
      ],
    },
    {
      category: 'Ingredients to Look For',
      tips: [
        { title: 'Niacinamide', body: 'Balances oil production on oily areas without drying the rest of your face.' },
        { title: 'Centella asiatica', body: 'Calms redness and supports the skin barrier on drier zones.' },
        { title: 'Hyaluronic acid', body: 'Hydrates without adding oil — works well across the whole face for combination skin.' },
      ],
    },
    {
      category: 'Lifestyle Tips',
      tips: [
        { title: 'Blotting papers', body: 'Keep blotting papers on hand to absorb midday shine on the T-zone without disturbing makeup.' },
        { title: 'Stay hydrated', body: 'Drinking enough water helps balance oil production and keeps dry areas plump.' },
      ],
    },
  ],

  sensitive: [
    {
      category: 'Morning Routine',
      tips: [
        { title: 'Water or gentle rinse', body: 'In the morning, rinsing with lukewarm water is enough — cleansers twice a day can over-strip sensitive skin.' },
        { title: 'Fragrance-free moisturiser', body: 'Apply a simple, fragrance-free moisturiser with ceramides and no unnecessary additives.' },
        { title: 'Mineral SPF', body: 'Zinc oxide-based SPF is less likely to cause reactions than chemical sunscreen filters.' },
      ],
    },
    {
      category: 'Evening Routine',
      tips: [
        { title: 'Micellar water first', body: 'Gentle micellar water removes makeup without friction — avoid rubbing or pulling.' },
        { title: 'Barrier repair moisturiser', body: 'Look for ceramides, centella asiatica, and panthenol to repair and calm skin overnight.' },
        { title: 'Patch test everything', body: 'Always patch test new products on your inner arm for 24 hours before applying to your face.' },
      ],
    },
    {
      category: 'Weekly Care',
      tips: [
        { title: 'Skip harsh exfoliants', body: 'Avoid scrubs entirely. If exfoliating, use a very low-concentration lactic acid (5%) once a week maximum.' },
        { title: 'Calming sheet mask', body: 'A centella or aloe vera sheet mask once a week can soothe reactive skin.' },
      ],
    },
    {
      category: 'Ingredients to Look For',
      tips: [
        { title: 'Ceramides', body: 'Strengthen the skin barrier, which is often compromised in sensitive skin types.' },
        { title: 'Centella asiatica', body: 'Powerful anti-inflammatory that reduces redness and calms irritation.' },
        { title: 'Panthenol (Vitamin B5)', body: 'Hydrates and soothes without causing reactions — well tolerated by almost all skin types.' },
      ],
    },
    {
      category: 'Ingredients to Avoid',
      tips: [
        { title: 'Fragrance & essential oils', body: 'The most common trigger for sensitive skin reactions — check the full ingredient list.' },
        { title: 'High-concentration acids', body: 'Strong AHAs/BHAs can destroy the barrier. Stick to low percentages if you use them at all.' },
        { title: 'Alcohol denat.', body: 'Found in many toners and sprays — strips the barrier and triggers inflammation on sensitive skin.' },
      ],
    },
  ],
}

const CONCERN_TIPS: Record<string, Tip> = {
  'Acne & breakouts': { title: 'Acne', body: 'Use benzoyl peroxide (2.5%) as a spot treatment and avoid picking — it pushes bacteria deeper and causes scarring.' },
  'Dark spots': { title: 'Dark spots', body: 'Vitamin C serum in the morning + SPF is the most effective combo for fading existing dark spots.' },
  'Redness': { title: 'Redness', body: 'Centella asiatica, azelaic acid and green tea extract are clinically proven to reduce persistent redness.' },
  'Fine lines': { title: 'Fine lines', body: 'Retinol (start at 0.025–0.05%) used 2–3x per week at night is the gold standard for reducing fine lines.' },
  'Dullness': { title: 'Dullness', body: 'Vitamin C serum every morning brightens skin tone. Regular gentle exfoliation removes dull dead cells.' },
  'Blackheads & pores': { title: 'Pores & blackheads', body: 'Salicylic acid + niacinamide used consistently shrinks pores and keeps them clear over time.' },
  'Uneven skin tone': { title: 'Uneven tone', body: 'Alpha arbutin, tranexamic acid and Vitamin C are the safest, most effective brighteners for uneven tone.' },
}

export async function GET() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const [profile] = await db
    .select()
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, user.id))
    .limit(1)

  if (!profile) {
    return NextResponse.json({ profile: null, categories: [] })
  }

  const skinType = (profile.skinType ?? 'combination') as keyof typeof TIPS
  const categories: TipCategory[] = TIPS[skinType] ?? TIPS.combination

  // Inject concern-specific tips as an extra category
  const concerns = profile.skinConcerns ?? []
  const concernTips = concerns
    .map((c) => CONCERN_TIPS[c])
    .filter(Boolean) as Tip[]

  if (concernTips.length > 0) {
    categories.push({ category: 'Your Specific Concerns', tips: concernTips })
  }

  return NextResponse.json({ profile, categories })
}
