import { useEffect, useRef, useState } from 'react';
import { Grid2x2, Hash, ImagePlus, Images, Settings, Sparkles, Wand2 } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { createSampleImage } from '../engine/sampleImage';
import { Button } from '../components/common/Button';
import { AiBadge } from '../components/common/AiBadge';

const HIGHLIGHTS: { title: string; text: string; ai?: 'cloud' | 'local' }[] = [
  { title: '20+ adjustments', text: 'Light, colour, HSL, curves, split toning, LUTs.' },
  {
    title: '200+ filters',
    text: 'Film, vintage, Japanese, Korean, cinematic and more, each with a strength slider.',
  },
  {
    title: 'Beauty',
    text: 'Skin smoothing, reshape, makeup, liquify, blemish removal.',
    ai: 'local',
  },
  {
    title: 'AI tools',
    text: 'Remove, replace, expand, restore, colorize, styles, hairstyle, sky, relight…',
    ai: 'cloud',
  },
  { title: 'Creative', text: 'Text, stickers, frames, doodle, mosaic, watermark, effects.' },
  {
    title: 'Collage & batch',
    text: 'Grids, posters, stitching and applying one look to many photos.',
  },
];

/** Landing screen: open a photo (tap, drop, paste), try a sample, collage or batch. */
export function HomeScreen() {
  const openFile = useEditorStore((s) => s.openFile);
  const openCanvas = useEditorStore((s) => s.openCanvas);
  const setScreen = useEditorStore((s) => s.setScreen);
  const setSettingsOpen = useEditorStore((s) => s.setSettingsOpen);
  const embed = useEditorStore((s) => s.embed);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent): void => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) =>
        f.type.startsWith('image/'),
      );
      if (file) void openFile(file, file.name || 'pasted-image.png');
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [openFile]);

  /** Opens the bundled sample photo; if it cannot be fetched (offline build), draws a picture instead. */
  const openSamplePhoto = async (): Promise<void> => {
    try {
      const response = await fetch(new URL('sample.jpg', document.baseURI).toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await openFile(await response.blob(), 'sample-photo.jpg');
    } catch {
      openCanvas(createSampleImage(), 'sample-photo.jpg', 'image/jpeg');
    }
  };

  const onDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) void openFile(file);
  };

  return (
    <div
      className={`h-full overflow-y-auto ${dragging ? 'bg-accent/10' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      data-testid="home"
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void openFile(f);
          e.target.value = '';
        }}
        data-testid="open-file-input"
      />
      <div className="max-w-3xl mx-auto px-5 py-10 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-accent text-accent-contrast flex items-center justify-center">
              <Hash size={23} strokeWidth={2.8} aria-hidden="true" />
            </span>
            <span className="font-semibold text-lg">HashClick</span>
          </div>
          {!embed && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings size={16} />}
              onClick={() => setSettingsOpen(true)}
              data-testid="home-settings"
            >
              Settings
            </Button>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-2">
          Edit photos like a pro, right in your browser.
        </h1>
        <p className="text-muted mb-8 max-w-xl">
          No account, no upload. Everything runs on your device. AI tools use your own API key, so
          you pay the provider directly and only for what you use.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-10">
          <button
            type="button"
            data-testid="open-photo"
            className="rounded-2xl border-2 border-dashed border-border hover:border-accent bg-surface p-6 text-left transition"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="text-accent mb-2" />
            <div className="font-semibold">Open a photo</div>
            <div className="text-xs text-muted">
              Tap to choose, or drag & drop / paste anywhere.
            </div>
          </button>
          <button
            type="button"
            data-testid="open-sample"
            className="rounded-2xl border border-border hover:border-accent bg-surface p-6 text-left transition"
            onClick={() => void openSamplePhoto()}
          >
            <Wand2 className="text-accent mb-2" />
            <div className="font-semibold">Try a sample photo</div>
            <div className="text-xs text-muted">Explore every tool with a built-in picture.</div>
          </button>
          <button
            type="button"
            data-testid="open-collage"
            className="rounded-2xl border border-border hover:border-accent bg-surface p-6 text-left transition"
            onClick={() => setScreen('collage')}
          >
            <Grid2x2 className="text-accent mb-2" />
            <div className="font-semibold">Make a collage</div>
            <div className="text-xs text-muted">Grids, posters, freestyle and long stitches.</div>
          </button>
          <button
            type="button"
            data-testid="open-batch"
            className="rounded-2xl border border-border hover:border-accent bg-surface p-6 text-left transition"
            onClick={() => setScreen('batch')}
          >
            <Images className="text-accent mb-2" />
            <div className="font-semibold">Batch edit</div>
            <div className="text-xs text-muted">
              Apply one filter or look to many photos and download a ZIP.
            </div>
          </button>
        </div>
        <h2 className="text-sm uppercase tracking-wider text-muted font-semibold mb-3">
          What is inside
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="rounded-xl bg-surface border border-border p-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                {h.ai === 'cloud' ? <Sparkles size={14} className="text-accent" /> : null}
                {h.title}
                {h.ai && <AiBadge kind={h.ai} />}
              </div>
              <div className="text-xs text-muted mt-0.5">{h.text}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-8">
          Open source (MIT). Your photos never leave your device unless you use a cloud AI tool.
        </p>
      </div>
    </div>
  );
}
