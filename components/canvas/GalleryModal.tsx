import { X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getGalleryItems } from "@/lib/api/gallery";
import { GalleryItem } from "@/lib/directus";

// Keep the hardcoded SVGs as fallback
const HARDCODED_ITEMS = [
  {
    id: "butterfly",
    name: "Butterfly",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="white"/><g fill="none" stroke="black" stroke-width="3"><path d="M400 150 C300 100 150 80 120 200 C90 320 200 400 300 350 C350 330 380 280 400 250"/><path d="M400 150 C500 100 650 80 680 200 C710 320 600 400 500 350 C450 330 420 280 400 250"/><path d="M400 250 C350 320 300 420 280 480 C260 520 320 540 350 500 C370 470 390 400 400 350"/><path d="M400 250 C450 320 500 420 520 480 C540 520 480 540 450 500 C430 470 410 400 400 350"/><line x1="400" y1="130" x2="350" y2="60"/><line x1="400" y1="130" x2="450" y2="60"/><circle cx="350" cy="55" r="5"/><circle cx="450" cy="55" r="5"/><ellipse cx="250" cy="200" rx="60" ry="40"/><ellipse cx="550" cy="200" rx="60" ry="40"/><circle cx="220" cy="300" r="30"/><circle cx="580" cy="300" r="30"/></g></svg>`,
  },
  {
    id: "flower",
    name: "Flower",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="white"/><g fill="none" stroke="black" stroke-width="3"><ellipse cx="400" cy="200" rx="50" ry="80" transform="rotate(0 400 250)"/><ellipse cx="400" cy="200" rx="50" ry="80" transform="rotate(60 400 250)"/><ellipse cx="400" cy="200" rx="50" ry="80" transform="rotate(120 400 250)"/><ellipse cx="400" cy="200" rx="50" ry="80" transform="rotate(180 400 250)"/><ellipse cx="400" cy="200" rx="50" ry="80" transform="rotate(240 400 250)"/><ellipse cx="400" cy="200" rx="50" ry="80" transform="rotate(300 400 250)"/><circle cx="400" cy="250" r="35"/><path d="M400 330 C400 400 395 500 400 560" stroke-width="4"/><path d="M400 420 C350 380 300 370 270 380" stroke-width="3"/><path d="M400 460 C450 430 500 420 530 430" stroke-width="3"/><ellipse cx="270" cy="380" rx="40" ry="20" transform="rotate(-20 270 380)"/><ellipse cx="530" cy="430" rx="40" ry="20" transform="rotate(15 530 430)"/></g></svg>`,
  },
  {
    id: "house",
    name: "House",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="white"/><g fill="none" stroke="black" stroke-width="3"><rect x="200" y="280" width="400" height="280"/><polygon points="400,100 150,280 650,280"/><rect x="340" y="400" width="120" height="160"/><rect x="240" y="320" width="80" height="80"/><rect x="480" y="320" width="80" height="80"/><line x1="280" y1="320" x2="280" y2="400"/><line x1="240" y1="360" x2="320" y2="360"/><line x1="520" y1="320" x2="520" y2="400"/><line x1="480" y1="360" x2="560" y2="360"/><circle cx="430" cy="490" r="8"/><rect x="520" y="180" width="40" height="100"/><rect x="515" y="170" width="50" height="15"/></g></svg>`,
  },
  {
    id: "fish",
    name: "Fish",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="white"/><g fill="none" stroke="black" stroke-width="3"><ellipse cx="380" cy="300" rx="220" ry="120"/><polygon points="600,300 720,200 720,400"/><circle cx="260" cy="270" r="20"/><circle cx="265" cy="265" r="8" fill="black"/><path d="M180 300 Q250 280 320 300 Q390 320 460 300" /><path d="M200 340 Q300 360 400 340"/><path d="M380 180 C400 220 420 250 380 250" /><path d="M350 180 C370 210 380 240 350 240" /><path d="M320 190 C340 220 340 240 320 240" /><path d="M300 380 C310 410 330 430 350 420"/><path d="M340 390 C350 420 370 440 390 430"/></g></svg>`,
  },
  {
    id: "star",
    name: "Star",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="white"/><g fill="none" stroke="black" stroke-width="3"><polygon points="400,60 460,220 630,220 490,320 545,480 400,380 255,480 310,320 170,220 340,220"/><circle cx="400" cy="270" r="50"/><circle cx="380" cy="255" r="8" fill="black"/><circle cx="420" cy="255" r="8" fill="black"/><path d="M385 280 Q400 295 415 280"/></g></svg>`,
  },
  {
    id: "car",
    name: "Car",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="white"/><g fill="none" stroke="black" stroke-width="3"><path d="M150 380 L150 300 L250 300 L320 200 L550 200 L620 300 L700 300 L700 380"/><line x1="150" y1="380" x2="700" y2="380"/><circle cx="260" cy="400" r="45"/><circle cx="260" cy="400" r="20"/><circle cx="590" cy="400" r="45"/><circle cx="590" cy="400" r="20"/><line x1="305" y1="380" x2="545" y2="380"/><rect x="340" y="220" width="90" height="80" rx="5"/><rect x="250" y="240" width="80" height="60" rx="5"/><rect x="450" y="240" width="80" height="60" rx="5"/><rect x="620" y="300" width="60" height="30" rx="5"/><circle cx="660" cy="315" r="8"/></g></svg>`,
  },
];

interface GalleryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export function GalleryModal({ open, onClose, onSelect }: GalleryModalProps) {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'gallery'>('templates');

  useEffect(() => {
    if (open && activeTab === 'gallery' && galleryItems.length === 0) {
      fetchGalleryItems();
    }
  }, [open, activeTab]);

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      const items = await getGalleryItems();
      setGalleryItems(items);
    } catch (error) {
      console.error('Error fetching gallery items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSvg = (svg: string) => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    onSelect(url);
    onClose();
  };

  const handleSelectImage = (imageId: string) => {
    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
    const imageUrl = `${directusUrl}/assets/${imageId}`;
    onSelect(imageUrl);
    onClose();
  };

  const getImageUrl = (imageId: string) => {
    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';
    return `${directusUrl}/assets/${imageId}?width=400&height=300&fit=cover`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-card-foreground">🖼️ Pick a Coloring Template</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 font-medium ${activeTab === 'templates' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 font-medium ${activeTab === 'gallery' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Gallery Images
          </button>
        </div>

        {activeTab === 'templates' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {HARDCODED_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectSvg(item.svg)}
                className="group relative rounded-xl border-2 border-border hover:border-primary overflow-hidden transition-all hover:shadow-lg bg-background aspect-[4/3]"
              >
                <div
                  className="w-full h-full p-2"
                  dangerouslySetInnerHTML={{ __html: item.svg.replace('width="800"', 'width="100%"').replace('height="600"', 'height="100%"') }}
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/60 to-transparent p-2">
                  <span className="text-xs font-semibold text-background">{item.name}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading gallery images...</span>
              </div>
            ) : galleryItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {galleryItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectImage(item.image)}
                    className="group relative rounded-xl border-2 border-border hover:border-primary overflow-hidden transition-all hover:shadow-lg bg-background aspect-[4/3]"
                  >
                    <div className="w-full h-full p-2 flex items-center justify-center">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/60 to-transparent p-2">
                      <span className="text-xs font-semibold text-background truncate">{item.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No gallery images found.</p>
                <p className="text-sm mt-1">Add images to your gallery in Directus to use them as templates.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
