'use client';
import { useEffect } from 'react';

export function IframeResizer() {
  useEffect(() => {
    const send = () =>
      window.parent?.postMessage(
        { type: 'resize', height: document.body.scrollHeight },
        'https://logos-serviciosfinancieros.com.ar'
      );
    const obs = new ResizeObserver(send);
    obs.observe(document.body);
    send();
    return () => obs.disconnect();
  }, []);
  return null;
}
