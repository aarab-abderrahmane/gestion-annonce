import { NextResponse } from 'next/server'

function notImplemented() {
  return NextResponse.json(
    { error: 'NextAuth is not configured in this project' },
    { status: 501 }
  )
}

export async function GET() {
  return notImplemented()
}

export async function POST() {
  return notImplemented()
}
