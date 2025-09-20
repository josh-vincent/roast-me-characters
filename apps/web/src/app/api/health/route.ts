import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - you can add more checks here
    // like database connectivity, external API status, etc.
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        server: 'ok',
        // Add more health checks here as needed
        // database: await checkDatabase(),
        // external_apis: await checkExternalAPIs(),
      }
    };

    return NextResponse.json(healthStatus, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      }, 
      { status: 503 }
    );
  }
}