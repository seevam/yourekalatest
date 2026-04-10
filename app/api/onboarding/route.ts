import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, skinProfiles } from '@/lib/schema'

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    ageRange,
    skinType,
    skinConcerns,
    sensitivities,
    knownConditions,
    allergies,
    budget,
    routinePreference,
    lifestyleData,
  } = body

  // Resolve internal user ID
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Upsert skin profile
  const [existing] = await db
    .select({ id: skinProfiles.id })
    .from(skinProfiles)
    .where(eq(skinProfiles.userId, user.id))
    .limit(1)

  if (existing) {
    await db
      .update(skinProfiles)
      .set({
        ageRange,
        skinType,
        skinConcerns,
        sensitivities,
        knownConditions,
        allergies,
        budget,
        routinePreference,
        lifestyleData,
        updatedAt: new Date(),
      })
      .where(eq(skinProfiles.userId, user.id))
  } else {
    await db.insert(skinProfiles).values({
      userId: user.id,
      ageRange,
      skinType,
      skinConcerns,
      sensitivities,
      knownConditions,
      allergies,
      budget,
      routinePreference,
      lifestyleData,
    })
  }

  return NextResponse.json({ success: true })
}
