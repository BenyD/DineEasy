import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get('title') || 'DineEasy';
  const description = searchParams.get('description') || 'Modern restaurant management made simple';
  const type = searchParams.get('type') || 'default';

  // Define colors based on type
  const getColors = (type: string) => {
    switch (type) {
      case 'pricing':
        return {
          primary: '#10b981',
          secondary: '#059669',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        };
      case 'features':
        return {
          primary: '#3b82f6',
          secondary: '#2563eb',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        };
      case 'solutions':
        return {
          primary: '#8b5cf6',
          secondary: '#7c3aed',
          background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
        };
      case 'setup':
        return {
          primary: '#f59e0b',
          secondary: '#d97706',
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        };
      default:
        return {
          primary: '#0f172a',
          secondary: '#475569',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        };
    }
  };

  const colors = getColors(type);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: colors.background,
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            transform: 'rotate(15deg)',
          }}
        />
        
        {/* Logo/Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
            fontSize: '48px',
            fontWeight: 'bold',
            color: colors.primary,
          }}
        >
          🍽️ DineEasy
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            color: colors.primary,
            margin: '0 0 20px 0',
            textAlign: 'center',
            lineHeight: '1.1',
            maxWidth: '900px',
          }}
        >
          {title}
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '32px',
            color: colors.secondary,
            margin: '0',
            textAlign: 'center',
            lineHeight: '1.4',
            maxWidth: '800px',
            fontWeight: '400',
          }}
        >
          {description}
        </p>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '8px',
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
} 