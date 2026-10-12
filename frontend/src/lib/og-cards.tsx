/* Satori (next/og) element trees. Every multi-child <div> must be display:flex. */
import type { ReactElement } from 'react';
import { BRAND } from './brand';
import { OG_SIZE, nameFontSize } from './og';

export const OG_FONT_FAMILY = 'Cormorant';

export function BrandCard(): ReactElement {
  return (
    <div
      style={{
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        background: BRAND.ivory,
        display: 'flex',
        padding: 28,
        fontFamily: OG_FONT_FAMILY,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${BRAND.stoneLight}`,
        }}
      >
        <div style={{ fontSize: 168, lineHeight: 1, color: BRAND.charcoal, letterSpacing: -2, display: 'flex' }}>Fresh Petals</div>
        <div style={{ width: 96, height: 2, background: BRAND.stone, marginTop: 44, marginBottom: 40, display: 'flex' }} />
        <div style={{ fontSize: 44, color: BRAND.stoneDark, letterSpacing: 6, textTransform: 'uppercase', display: 'flex' }}>
          Farm-fresh flowers, delivered
        </div>
      </div>
    </div>
  );
}

export function ProductCard({ name, price, photo }: { name: string; price: string | null; photo: string | null }): ReactElement {
  return (
    <div style={{ width: OG_SIZE.width, height: OG_SIZE.height, background: BRAND.ivory, display: 'flex', fontFamily: OG_FONT_FAMILY }}>
      <div style={{ width: 600, height: OG_SIZE.height, display: 'flex', background: BRAND.ivoryDeep, alignItems: 'center', justifyContent: 'center' }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} width={600} height={OG_SIZE.height} alt="" style={{ width: 600, height: OG_SIZE.height, objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              width: 544,
              height: 574,
              border: `2px solid ${BRAND.stoneLight}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 76,
              color: BRAND.stoneDark,
              letterSpacing: -1,
            }}
          >
            Fresh Petals
          </div>
        )}
      </div>
      <div
        style={{
          width: 600,
          height: OG_SIZE.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 64px 64px 68px',
          borderLeft: `2px solid ${BRAND.stoneLight}`,
        }}
      >
        <div style={{ fontSize: 26, color: BRAND.stoneDark, letterSpacing: 5, textTransform: 'uppercase', display: 'flex' }}>
          Fresh Petals India
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: nameFontSize(name),
              lineHeight: 1.05,
              color: BRAND.charcoal,
              maxHeight: 360,
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            {name}
          </div>
          {price && <div style={{ fontSize: 48, color: BRAND.moss, marginTop: 28, display: 'flex' }}>{price}</div>}
        </div>
        <div style={{ fontSize: 22, color: BRAND.stone, letterSpacing: 2, textTransform: 'uppercase', display: 'flex' }}>
          Farm-fresh flowers, delivered
        </div>
      </div>
    </div>
  );
}
