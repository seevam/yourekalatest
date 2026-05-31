import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, productMatches, products } from '@/lib/schema'

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

  const matches = await db
    .select({
      matchId: productMatches.id,
      matchScore: productMatches.matchScore,
      matchReason: productMatches.matchReason,
      createdAt: productMatches.createdAt,
      product: {
        id: products.id,
        name: products.name,
        brand: products.brand,
        category: products.category,
        price: products.price,
        imageUrl: products.imageUrl,
        buyLink: products.buyLink,
        skinTypeMatch: products.skinTypeMatch,
        concernsTargeted: products.concernsTargeted,
        isFragranceFree: products.isFragranceFree,
        isVegan: products.isVegan,
      },
    })
    .from(productMatches)
    .innerJoin(products, eq(productMatches.productId, products.id))
    .where(eq(productMatches.userId, user.id))
    .orderBy(productMatches.matchScore)

  return NextResponse.json(matches)
}
