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
            background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            borderBottom: '2px solid rgba(255,255,255,0.1)',
          }}
        >
          <span style={{ display: 'flex', fontSize: '28px' }}>🔥</span>
          <span style={{ 
            display: 'flex', 
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '0.5px',
          }}>
            roastme.tocld.com
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '40px',
            marginTop: '20px',
            textAlign: 'center',
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
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: '20px',
              }}
            >
              BEFORE
            </div>
            <div
              style={{
                width: '300px',
                height: '300px',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '4px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f3f4f6',
              }}
            >
              {originalImage ? (
                <img
                  src={originalImage}
                  alt="Original"
                  width="300"
                  height="300"
                  style={{ objectFit: 'cover' }}
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
              fontSize: '60px',
              color: '#6366f1',
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
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: '20px',
              }}
            >
              AFTER
            </div>
            <div
              style={{
                width: '300px',
                height: '300px',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '4px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ddd6fe 0%, #c7d2fe 100%)',
              }}
            >
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated"
                  width="300"
                  height="300"
                  style={{ objectFit: 'cover' }}
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
              fontSize: '22px',
              color: '#dc2626',
              textAlign: 'center',
              marginTop: '40px',
              fontStyle: 'italic',
              maxWidth: '800px',
              padding: '0 20px',
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