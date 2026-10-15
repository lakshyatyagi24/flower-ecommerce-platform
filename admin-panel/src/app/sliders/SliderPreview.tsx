'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { overlayBackground, POSITION_CLASSES, type SliderFormData } from '@/lib/sliders';

interface SliderPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What to render: a list row's slider, or the form being edited. */
  data: SliderFormData;
}

const BUTTON_STYLES = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
} as const;

export function SliderPreview({ open, onOpenChange, data }: SliderPreviewProps) {
  const { config } = data;
  const behavior = config.routing?.behavior;
  const wholeImageLink = (behavior === 'complete-image-and-button' || behavior === 'whole-image') && data.href;
  const buttonClass = `px-6 py-3 rounded font-medium transition-colors ${BUTTON_STYLES[config.button?.style ?? 'outline'] ?? BUTTON_STYLES.outline}`;
  const buttonLabel = config.button?.text || 'Learn More';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Slider Preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">This is how your slider will appear on the website:</div>

          <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
            {wholeImageLink ? (
              <a
                href={data.href}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-10"
                title="Click to navigate"
              />
            ) : null}

            {data.image && (
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${data.image})` }}
              />
            )}

            {config.overlay && (
              <div
                className={`absolute inset-0 flex ${POSITION_CLASSES[config.overlay.position ?? 'center'] ?? POSITION_CLASSES.center}`}
                style={{ backgroundColor: overlayBackground(config.overlay.backgroundColor, config.overlay.backgroundOpacity) }}
              >
                <div
                  className={`p-6 max-w-2xl ${
                    config.overlay.textAlign === 'left' ? 'text-left' : config.overlay.textAlign === 'right' ? 'text-right' : 'text-center'
                  }`}
                  style={{ color: config.overlay.textColor || '#ffffff' }}
                >
                  {data.eyebrow && <div className="text-sm font-light mb-2 opacity-90">{data.eyebrow}</div>}
                  {data.title && <h1 className="text-4xl font-bold mb-4">{data.title}</h1>}
                  {data.subtitle && <p className="text-lg opacity-90 mb-6">{data.subtitle}</p>}

                  {config.button?.show && (
                    <div className={config.button.position === 'below' ? 'mt-6' : ''}>
                      {behavior === 'button-only' && data.href ? (
                        <a href={data.href} target="_blank" rel="noopener noreferrer">
                          <button type="button" className={buttonClass}>{buttonLabel}</button>
                        </a>
                      ) : (
                        <button type="button" className={buttonClass}>{buttonLabel}</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!data.image && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4" aria-hidden="true">🖼️</div>
                  <div>No image selected</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Content</h4>
              <div className="space-y-1 text-muted-foreground">
                <div>Title: {data.title || 'None'}</div>
                <div>Eyebrow: {data.eyebrow || 'None'}</div>
                <div>Subtitle: {data.subtitle || 'None'}</div>
                <div>Link: {data.href || 'None'}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Configuration</h4>
              <div className="space-y-1 text-muted-foreground">
                <div>Image: {data.image ? (data.imageUploadMethod === 'upload' ? 'Uploaded' : 'URL') : 'None'}</div>
                <div>Overlay: {config.overlay ? 'Enabled' : 'Disabled'}</div>
                <div>Button: {config.button?.show ? 'Enabled' : 'Disabled'}</div>
                <div>Routing: {behavior === 'complete-image-and-button' || behavior === 'whole-image' ? 'Complete Image & Button' : 'Button Only'}</div>
                <div>Status: {data.active ? 'Active' : 'Inactive'}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
