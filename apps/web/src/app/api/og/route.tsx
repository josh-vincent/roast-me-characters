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
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
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
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            borderBottom: '3px solid rgba(255,165,0,0.5)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
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

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '42px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '30px',
            marginTop: '100px',
            textAlign: 'center',
            maxWidth: '900px',
          }}
        >
          {title}
        </div>

        {/* Images Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '80px',
          }}
        >
          {/* Original Image */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#6b7280',
                marginBottom: '16px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              Original
            </div>
            <div
              style={{
                width: '320px',
                height: '320px',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '6px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              }}
            >
              {originalImage ? (
                <img
                  src={originalImage}
                  alt="Original"
                  width="320"
                  height="320"
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              ) : (
                <div style={{ display: 'flex', fontSize: '60px' }}>📷</div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '48px',
              color: '#f97316',
              fontWeight: 'bold',
              textShadow: '2px 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            →
          </div>

          {/* Generated Image */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#f97316',
                marginBottom: '16px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              AI Roasted
            </div>
            <div
              style={{
                width: '320px',
                height: '320px',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '6px solid #fed7aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                boxShadow: '0 10px 40px rgba(251,146,60,0.2)',
              }}
            >
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated"
                  width="320"
                  height="320"
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              ) : (
                <div style={{ display: 'flex', fontSize: '60px' }}>🎭</div>
              )}
            </div>
          </div>
        </div>

        {/* Punchline or Features */}
        {punchline ? (
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              color: '#dc2626',
              textAlign: 'center',
              marginTop: '35px',
              fontStyle: 'italic',
              fontWeight: '500',
              maxWidth: '900px',
              padding: '0 40px',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            "{punchline}"
          </div>
        ) : features.length > 0 ? (
          <div
            style={{
              display: 'flex',
              fontSize: '20px',
              color: '#6b7280',
              textAlign: 'center',
              marginTop: '40px',
            }}
          >
            {features.slice(0, 3).join(' • ')}
          </div>
        ) : null}

      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}