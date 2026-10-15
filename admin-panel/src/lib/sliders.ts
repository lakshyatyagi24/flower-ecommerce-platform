// Types and pure helpers for the sliders admin page (no React, no network).
import type { AdminSlider, AdminSliderInput } from './api';

export type OverlayPosition =
  | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

export interface SliderConfig {
  overlay?: {
    position?: OverlayPosition;
    textColor?: string;
    backgroundColor?: string;
    backgroundOpacity?: number;
    textAlign?: 'left' | 'center' | 'right';
  };
  button?: {
    show?: boolean;
    text?: string;
    style?: 'primary' | 'secondary' | 'outline';
    position?: 'overlay' | 'below';
  };
  layout?: {
    contentWidth?: 'full' | 'container' | 'narrow';
    verticalAlign?: 'top' | 'center' | 'bottom';
  };
  routing?: {
    behavior?: 'complete-image-and-button' | 'button-only' | 'whole-image';
  };
}

export type SliderConfigSection = keyof SliderConfig;

export interface SliderFormData {
  title: string;
  eyebrow: string;
  subtitle: string;
  alt: string;
  image: string;
  imageFile: File | null;
  imageUploadMethod: 'url' | 'upload';
  href: string;
  config: SliderConfig;
  sortOrder: string;
  active: boolean;
}

/** A fresh copy every call: callers mutate nothing, but form state must never share references. */
export function defaultSliderConfig(): Required<SliderConfig> {
  return {
    overlay: { position: 'center', textColor: '#ffffff', backgroundColor: '#000000', backgroundOpacity: 50, textAlign: 'center' },
    button: { show: true, text: 'Learn More', style: 'primary', position: 'overlay' },
    layout: { contentWidth: 'container', verticalAlign: 'center' },
    routing: { behavior: 'complete-image-and-button' },
  };
}

export function blankSliderForm(): SliderFormData {
  return {
    title: '',
    eyebrow: '',
    subtitle: '',
    alt: '',
    image: '',
    imageFile: null,
    imageUploadMethod: 'url',
    href: '',
    config: defaultSliderConfig(),
    sortOrder: '',
    active: true,
  };
}

/**
 * Form state for an existing slider. Same shallow defaults-then-stored merge the page always used. Legacy
 * sliders stored an inline `data:` image; those open in "upload" mode so the thumbnail + Replace UI shows.
 */
export function sliderToForm(slider: AdminSlider, overrides: Partial<SliderFormData> = {}): SliderFormData {
  const config = slider.config ? ({ ...defaultSliderConfig(), ...slider.config } as SliderConfig) : defaultSliderConfig();
  return {
    title: slider.title || '',
    eyebrow: slider.eyebrow || '',
    subtitle: slider.subtitle || '',
    alt: slider.alt || '',
    image: slider.image || '',
    imageFile: null,
    imageUploadMethod: slider.image && slider.image.startsWith('data:') ? 'upload' : 'url',
    href: slider.href || '',
    config,
    sortOrder: slider.sortOrder.toString(),
    active: slider.active,
    ...overrides,
  };
}

/** Change one config section. Fields the section lacks are filled with the defaults the form displays. */
export function patchConfigSection<K extends SliderConfigSection>(
  config: SliderConfig,
  section: K,
  patch: Partial<NonNullable<SliderConfig[K]>>,
): SliderConfig {
  const defaults = defaultSliderConfig()[section] as NonNullable<SliderConfig[K]>;
  return { ...config, [section]: { ...defaults, ...config[section], ...patch } };
}

const CONFIG_SECTIONS: SliderConfigSection[] = ['overlay', 'button', 'layout', 'routing'];

/** Only sections that carry at least one defined value are sent; unknown sections are dropped. */
export function cleanSliderConfig(config: SliderConfig | undefined): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  if (!config) return cleaned;
  for (const section of CONFIG_SECTIONS) {
    const value = config[section];
    if (value && Object.values(value).some((v) => v !== undefined)) cleaned[section] = value;
  }
  return cleaned;
}

/** True when there is nothing to show: no text and no image (URL or chosen file). */
export function isSliderEmpty(form: SliderFormData): boolean {
  const noImage =
    (form.imageUploadMethod === 'url' && !form.image) || (form.imageUploadMethod === 'upload' && !form.imageFile);
  return !form.title && !form.eyebrow && !form.subtitle && noImage;
}

/** Request body. `sortOrder` is only sent when editing (the server auto-assigns it on create). */
export function buildSliderPayload(form: SliderFormData, imageUrl: string, editing: boolean): AdminSliderInput {
  return {
    title: form.title || undefined,
    eyebrow: form.eyebrow || undefined,
    subtitle: form.subtitle || undefined,
    alt: form.alt || undefined,
    image: imageUrl || undefined,
    href: form.href || undefined,
    config: cleanSliderConfig(form.config),
    sortOrder: editing && form.sortOrder ? parseInt(form.sortOrder, 10) : undefined,
    active: form.active,
  };
}

/** `#rrggbb` + opacity percent (0-100) as an 8-digit hex colour. */
export function overlayBackground(color: string | undefined, opacityPercent: number | undefined): string {
  if (!color) return 'rgba(0, 0, 0, 0.5)';
  const alpha = Math.round((opacityPercent ?? 50) * 2.55).toString(16).padStart(2, '0');
  return `${color}${alpha}`;
}

export const POSITION_CLASSES: Record<OverlayPosition, string> = {
  center: 'items-center justify-center',
  'top-left': 'items-start justify-start',
  'top-right': 'items-start justify-end',
  'bottom-left': 'items-end justify-start',
  'bottom-right': 'items-end justify-end',
  'top-center': 'items-start justify-center',
  'bottom-center': 'items-end justify-center',
};
