import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Example: proxy to downstream service
  // const response = await fetch('http://backend-service/api/...');
  // return NextResponse.json(await response.json());

  return NextResponse.json({ message: 'Replace with your BFF logic' });
}
