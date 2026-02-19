import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ed7420',
          borderRadius: '40px',
        }}
      >
        <svg
          width="140"
          height="140"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 65H65L75 125H140L150 75H70"
            stroke="white"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="85" cy="140" r="12" fill="white" />
          <circle cx="125" cy="140" r="12" fill="white" />
          <path d="M95 85L115 100L95 115V85Z" fill="white" />
          <path
            d="M50 65L45 50H35"
            stroke="white"
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  );
}
