import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const mainImage = searchParams.get('main');
  const originalImage = searchParams.get('original');
  const title = searchParams.get('title') || 'AI Roast Character';
  const figurineName = searchParams.get('figurine') || '';
  
  return new ImageResponse(
    (
      <div
        style={{
          height: '1080px',
          width: '1080px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f3e7fc 0%, #e7f3fc 100%)',
          fontFamily: 'system-ui',
          position: 'relative',
        }}
      >
        {/* Main AI Generated Image */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {mainImage ? (
            <img
              src={mainImage}
              alt="AI Character"
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div style={{ 
              display: 'flex',
              fontSize: '200px',
              color: '#e5e7eb',
            }}>
              🎭
            </div>
          )}
          
          {/* Original Image Overlay - Bottom Right (1/4 size) */}
          {originalImage && (
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '270px',  // 1/4 of 1080px
                height: '270px', // 1/4 of 1080px
                background: 'white',
                borderRadius: '0',
                border: '2px solid white',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={originalImage}
                alt="Original"
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}
          
          {/* Banner across top of image */}
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
              borderBottom: '4px solid rgba(255,165,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '48px' }}>🔥</span>
              <span style={{ 
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '1px',
              }}>
                roastme.tocld.com
              </span>
            </div>
          </div>
          
          {/* Bottom Info Bar */}
          {(title || figurineName) && (
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {title && (
                <div style={{ 
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                }}>
                  {title}
                </div>
              )}
              {figurineName && (
                <div style={{ 
                  fontSize: '18px',
                  color: 'rgba(255,165,0,0.9)',
                  fontStyle: 'italic',
                }}>
                  "{figurineName}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
    }
  );
}