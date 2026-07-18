import type { ImgHTMLAttributes, SVGProps } from 'react';

export function BrandLogo(props: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>) {
  return <img src="/brand/wonderpin-bi.png" alt="원더핀" {...props} />;
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.5" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
