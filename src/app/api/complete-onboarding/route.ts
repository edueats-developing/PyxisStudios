import { NextResponse } from 'next/server';

// This endpoint is deprecated as account creation is now handled in the registration page
export async function POST(req: Request) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Please complete registration through the registration page.' },
    { status: 410 }
  );
}
