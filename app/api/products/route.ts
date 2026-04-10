import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products } from '@/lib/schema'

export async function GET() {
  const all = await db.select().from(products)
  return NextResponse.json(all)
}
