import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const originalImage = searchParams.get('original');
  const generatedImage = searchParams.get('generated');
  const title = searchParams.get('title') || 'AI Character';
  const punchline = searchParams.get('punchline');
  const features = searchParams.get('features')?.split(',') || [];

  return new ImageResponse(
    (
      <div
        style={{
          height: '630px',
          width: '1200px',
          display: 'flex',
          flexDirection: 'column',
          background: 'white',
          fontFamily: 'system-ui',
          position: 'relative',
        }}
      >
        {/* Top Banner */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 100%)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            borderBottom: '3px solid rgba(255,165,0,0.5)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: '10',
          }}
        >
          <span style={{ display: 'flex', fontSize: '36px' }}>🔥</span>
          <span style={{ 
            display: 'flex', 
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '1px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}>
            roastme.tocld.com
          </span>
        </div>

        {/* Main Content - Images Side by Side */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            paddingTop: '70px', // Space for banner
          }}
        >
          {/* Original Image - Left Half */}
          <div
            style={{
              width: '50%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              padding: '10px',
            }}
          >
            {originalImage ? (
              <img
                src={originalImage}
                alt="Original"
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                }}
              />
            ) : (
              <div style={{ 
                display: 'flex',
                fontSize: '100px',
                color: '#e5e7eb',
              }}>
                📷
              </div>
            )}
          </div>

          {/* Generated Image - Right Half */}
          <div
            style={{
              width: '50%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              padding: '10px',
            }}
          >
            {generatedImage ? (
              <img
                src={generatedImage}
                alt="Generated"
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(251,146,60,0.15)',
                }}
              />
            ) : (
              <div style={{ 
                display: 'flex',
                fontSize: '100px',
                color: '#fed7aa',
              }}>
                🎭
              </div>
            )}
          </div>
        </div>


      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}