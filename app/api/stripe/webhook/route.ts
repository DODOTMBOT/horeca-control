import { NextRequest, NextResponse } from 'next/server'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(_request: NextRequest) {
  try {
    // Mock webhook processing
    console.log('Mock webhook received')
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing mock webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
