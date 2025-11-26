import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('=== Create Technician API Called ===')
  
  try {
    // Regular client for checking current user
    const supabase = await createClient()
    
    // Check if user is boss/admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Current user:', user?.email, 'Error:', userError)
    
    if (!user) {
      console.log('No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized - not logged in' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('User profile role:', profile?.role)

    if (profile?.role !== 'admin' && profile?.role !== 'boss') {
      console.log('User is not admin or boss, role is:', profile?.role)
      return NextResponse.json({ error: 'Unauthorized - must be admin or boss' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Request body received:', { ...body, password: '[HIDDEN]' })
    
    const { email, password, full_name, phone } = body

    // Validate input
    if (!email || !password || !full_name) {
      console.log('Missing required fields')
      return NextResponse.json({ 
        error: 'Email, password, and full name are required' 
      }, { status: 400 })
    }

    if (password.length < 6) {
      console.log('Password too short')
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters' 
      }, { status: 400 })
    }

    console.log('Creating admin client...')
    // Create admin client for user creation
    const adminClient = createAdminClient()

    console.log('Creating auth user for:', email)
    // Create the auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name,
        role: 'technician'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      
      // Check if user already exists
      if (authError.message?.includes('already registered')) {
        return NextResponse.json({ 
          error: 'A user with this email already exists' 
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: authError.message || 'Failed to create user account' 
      }, { status: 500 })
    }

    if (!authData.user) {
      console.log('No user returned from auth creation')
      return NextResponse.json({ 
        error: 'Failed to create user account' 
      }, { status: 500 })
    }

    console.log('Auth user created, ID:', authData.user.id)
    console.log('Creating profile...')

    // Create or update profile for the new user
    const { data: newProfile, error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: full_name,
        phone: phone || null,
        role: 'technician',
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating technician profile:', profileError)
      // Note: Auth user was created, but profile failed
      // In production, you might want to delete the auth user here
      return NextResponse.json({ 
        error: 'User created but profile setup failed. Please contact support.' 
      }, { status: 500 })
    }

    console.log('Profile created successfully:', newProfile.id)

    return NextResponse.json({ 
      success: true,
      technician: newProfile,
      credentials: {
        email: email,
        temporaryPassword: password
      },
      message: 'Technician created successfully!'
    })

  } catch (error) {
    console.error('Unexpected error in create technician:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
