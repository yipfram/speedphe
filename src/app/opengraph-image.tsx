import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'stretch',
        background: 'linear-gradient(135deg, #f7efe3 0%, #efe4d3 48%, #f8f4ee 100%)',
        color: '#241a14',
        display: 'flex',
        height: '100%',
        padding: '54px',
        width: '100%',
      }}
    >
      <div
        style={{
          background:
            'radial-gradient(circle at top left, rgba(204, 120, 52, 0.28), transparent 32%)',
          border: '1px solid rgba(36, 26, 20, 0.08)',
          borderRadius: '36px',
          display: 'flex',
          flex: 1,
          justifyContent: 'space-between',
          overflow: 'hidden',
          padding: '44px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            maxWidth: '650px',
          }}
        >
          <div
            style={{
              color: '#9a5320',
              display: 'flex',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
            }}
          >
            Measured cafe Wi-Fi
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 68,
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              Find cafes with fast Wi-Fi for remote work.
            </div>
            <div
              style={{
                color: '#5f5248',
                display: 'flex',
                fontSize: 30,
                lineHeight: 1.35,
              }}
            >
              Compare real speed test data across Hanoi and Ho Chi Minh City.
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
            }}
          >
            <Badge label="Hanoi" />
            <Badge label="Ho Chi Minh City" />
            <Badge label="Call / Gaming / Streaming" />
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            minWidth: 320,
            position: 'relative',
          }}
        >
          <div
            style={{
              background: '#fffaf3',
              border: '1px solid rgba(36, 26, 20, 0.08)',
              borderRadius: '30px',
              boxShadow: '0 24px 60px rgba(31, 26, 23, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              padding: '26px 24px',
              width: 290,
            }}
          >
            <Metric label="Download" value="82 Mbps" tone="#1d9f5a" />
            <Metric label="Upload" value="41 Mbps" tone="#9a5320" />
            <Metric label="Latency" value="18 ms" tone="#d5a021" />
          </div>
        </div>
      </div>
    </div>,
    size
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.82)',
        border: '1px solid rgba(36, 26, 20, 0.08)',
        borderRadius: 9999,
        color: '#241a14',
        display: 'flex',
        fontSize: 22,
        fontWeight: 600,
        padding: '12px 18px',
      }}
    >
      {label}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          color: '#6b5c51',
          display: 'flex',
          fontSize: 22,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: tone,
          display: 'flex',
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}
