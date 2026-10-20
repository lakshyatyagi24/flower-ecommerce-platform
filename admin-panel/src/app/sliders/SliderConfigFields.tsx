'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { OverlayPosition, SliderConfig, SliderConfigSection } from '@/lib/sliders';

export type PatchConfig = <K extends SliderConfigSection>(section: K, change: Partial<NonNullable<SliderConfig[K]>>) => void;

interface ConfigSelectProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

/** A labelled select; the label is wired to the trigger so it is announced and clickable. */
function ConfigSelect<T extends string>({ id, label, value, options, onChange }: ConfigSelectProps<T>) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ConfigGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <Label className="text-sm font-medium">{title}</Label>
      {children}
    </div>
  );
}

const POSITION_OPTIONS: { value: OverlayPosition; label: string }[] = [
  { value: 'center', label: 'Center' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'bottom-center', label: 'Bottom Center' },
];

const TEXT_ALIGN_OPTIONS = [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }] as const;

const BUTTON_STYLE_OPTIONS = [{ value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'outline', label: 'Outline' }] as const;

const BUTTON_POSITION_OPTIONS = [{ value: 'overlay', label: 'Overlay' }, { value: 'below', label: 'Below Content' }] as const;

const ROUTING_OPTIONS = [
  { value: 'complete-image-and-button', label: 'Complete Image & Button' },
  { value: 'button-only', label: 'Button Only' },
] as const;

const WIDTH_OPTIONS = [{ value: 'full', label: 'Full Width' }, { value: 'container', label: 'Container' }, { value: 'narrow', label: 'Narrow' }] as const;

const VERTICAL_OPTIONS = [{ value: 'top', label: 'Top' }, { value: 'center', label: 'Center' }, { value: 'bottom', label: 'Bottom' }] as const;

type SectionProps = { config: SliderConfig; patch: PatchConfig };

function OverlaySettings({ config, patch }: SectionProps) {
  return (
    <ConfigGroup title="Overlay Settings">
      <div className="grid grid-cols-2 gap-4">
        <ConfigSelect
          id="overlay-position"
          label="Position"
          value={config.overlay?.position || 'center'}
          options={POSITION_OPTIONS}
          onChange={(position) => patch('overlay', { position })}
        />
        <ConfigSelect
          id="overlay-textAlign"
          label="Text Alignment"
          value={config.overlay?.textAlign || 'center'}
          options={[...TEXT_ALIGN_OPTIONS]}
          onChange={(textAlign) => patch('overlay', { textAlign })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ColorField id="overlay-textColor" label="Text Color" value={config.overlay?.textColor || '#ffffff'} onChange={(textColor) => patch('overlay', { textColor })} />
        <ColorField id="overlay-backgroundColor" label="Background Color" value={config.overlay?.backgroundColor || '#000000'} onChange={(backgroundColor) => patch('overlay', { backgroundColor })} />
      </div>
      <div>
        <Label htmlFor="overlay-backgroundOpacity">Background Opacity (%)</Label>
        <Input
          id="overlay-backgroundOpacity"
          type="number"
          min="0"
          max="100"
          value={config.overlay?.backgroundOpacity ?? 50}
          onChange={(e) => patch('overlay', { backgroundOpacity: parseInt(e.target.value, 10) || 0 })}
        />
      </div>
    </ConfigGroup>
  );
}

function ButtonDetails({ config, patch }: SectionProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="button-text">Button Text</Label>
          <Input
            id="button-text"
            value={config.button?.text || ''}
            onChange={(e) => patch('button', { text: e.target.value })}
            placeholder="Learn More"
          />
        </div>
        <ConfigSelect
          id="button-style"
          label="Button Style"
          value={config.button?.style || 'primary'}
          options={[...BUTTON_STYLE_OPTIONS]}
          onChange={(style) => patch('button', { style })}
        />
      </div>
      <ConfigSelect
        id="button-position"
        label="Button Position"
        value={config.button?.position || 'overlay'}
        options={[...BUTTON_POSITION_OPTIONS]}
        onChange={(position) => patch('button', { position })}
      />
    </>
  );
}

function ButtonSettings({ config, patch }: SectionProps) {
  return (
    <ConfigGroup title="Button Settings">
      <div className="flex items-center space-x-2">
        <Switch id="button-show" checked={config.button?.show || false} onCheckedChange={(show) => patch('button', { show })} />
        <Label htmlFor="button-show">Show Button</Label>
      </div>
      {config.button?.show && <ButtonDetails config={config} patch={patch} />}
    </ConfigGroup>
  );
}

function RoutingSettings({ config, patch }: SectionProps) {
  return (
    <ConfigGroup title="Routing Settings">
      <ConfigSelect
        id="routing-behavior"
        label="Routing Behavior"
        value={config.routing?.behavior || 'complete-image-and-button'}
        options={[...ROUTING_OPTIONS]}
        onChange={(behavior) => patch('routing', { behavior })}
      />
      <p className="text-xs text-muted-foreground mt-1">
        Choose whether the entire slider image/content and button should be clickable or only the button.
      </p>
    </ConfigGroup>
  );
}

function LayoutSettings({ config, patch }: SectionProps) {
  return (
    <ConfigGroup title="Layout Settings">
      <div className="grid grid-cols-2 gap-4">
        <ConfigSelect
          id="layout-contentWidth"
          label="Content Width"
          value={config.layout?.contentWidth || 'container'}
          options={[...WIDTH_OPTIONS]}
          onChange={(contentWidth) => patch('layout', { contentWidth })}
        />
        <ConfigSelect
          id="layout-verticalAlign"
          label="Vertical Alignment"
          value={config.layout?.verticalAlign || 'center'}
          options={[...VERTICAL_OPTIONS]}
          onChange={(verticalAlign) => patch('layout', { verticalAlign })}
        />
      </div>
    </ConfigGroup>
  );
}

export function SliderConfigFields({ config, patch }: SectionProps) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Configuration</Label>
      <OverlaySettings config={config} patch={patch} />
      <ButtonSettings config={config} patch={patch} />
      <RoutingSettings config={config} patch={patch} />
      <LayoutSettings config={config} patch={patch} />
    </div>
  );
}
