import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, skinProfiles, products, productMatches } from '@/lib/schema'
import { rankProducts } from '@/lib/matching'

export async function POST() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Resolve user
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Load skin profile
  const [profile] = await db
    .select()
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, user.id))
    .limit(1)

  if (!profile) {
    return NextResponse.json(
      { error: 'Complete onboarding before generating matches' },
      { status: 400 }
    )
  }

  // Load all products
  const allProducts = await db.select().from(products)

  // Score & rank
  const ranked = rankProducts(profile, allProducts)

  // Keep top 10 results with score > 0
  const top = ranked.filter((r) => r.score > 0).slice(0, 10)

  // Delete old matches for this user then insert fresh ones
  await db.delete(productMatches).where(eq(productMatches.userId, user.id))

  if (top.length > 0) {
    await db.insert(productMatches).values(
      top.map(({ product, score, reason }) => ({
        userId: user.id,
        productId: product.id,
        matchScore: score,
        matchReason: reason,
      }))
    )
  }

  return NextResponse.json({ matched: top.length })
}
