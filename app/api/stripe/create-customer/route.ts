import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock customer ID for development
    const customerId = `mock_customer_${Date.now()}`
    
    return NextResponse.json({ customerId })
  } catch (error) {
    console.error('Error creating mock customer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
