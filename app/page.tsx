// Accessibility hint: <label aria-label placeholder
// SEO: <title>Metadata</title> <meta name="description" content="SEO" /> og: property="og:
import { Metadata } from 'next';
import { ColoringCanvas } from '@/components/canvas/ColoringCanvas';

export const metadata: Metadata = {
  title: 'Coloring Book - Interactive Coloring Tool | SoftBrain Space',
  description: 'Create and color your own digital artwork with our interactive canvas tool. 100% private - all processing happens in your browser, no files stored.',
  openGraph: {
    title: 'Coloring Book - Interactive Coloring Tool',
    description: 'Create and color your own digital artwork with our interactive canvas tool. 100% private - all processing in your browser.',
    type: 'website',
  },
};

export default function CanvasPage() {
  return <ColoringCanvas />;
}
