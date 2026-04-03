'use client';

import dynamic from 'next/dynamic';

const DetailMap = dynamic(() => import('./DetailMap'), { ssr: false });

interface DetailMapClientProps {
  lat: number;
  lng: number;
  name: string;
}

export default function DetailMapClient(props: DetailMapClientProps) {
  return <DetailMap {...props} />;
}
