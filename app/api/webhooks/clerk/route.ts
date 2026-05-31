import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'

interface ClerkUserCreatedEvent {
  type: 'user.created'
  data: {
    id: string
    email_addresses: { email_address: string }[]
    first_name: string | null
    last_name: string | null
  }
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const headerList = headers()
  const svixId = headerList.get('svix-id')
  const svixTimestamp = headerList.get('svix-timestamp')
  const svixSignature = headerList.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await req.text()

  const wh = new Webhook(secret)
  let evt: ClerkUserCreatedEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserCreatedEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data
    const email = email_addresses[0]?.email_address
    const name = [first_name, last_name].filter(Boolean).join(' ') || null

    await db.insert(users).values({ clerkUserId: id, email, name })
  }

  return NextResponse.json({ received: true })
}
