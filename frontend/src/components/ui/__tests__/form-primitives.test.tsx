import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Field from '../Field';
import Input, { PasswordInput } from '../Input';
import Textarea from '../Textarea';
import Select from '../Select';
import RadioCard from '../RadioCard';
import FormError from '../FormError';

describe('Field + Input', () => {
  it('associates the label with the control', () => {
    render(
      <Field label="Email">
        <Input type="email" />
      </Field>,
    );
    expect(screen.getByLabelText(/^email/i)).toBeInstanceOf(HTMLInputElement);
  });

  it('wires hint and error text through aria-describedby and flags the control invalid', () => {
    render(
      <Field label="Phone" hint="10 digits" error="Enter a valid phone">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText(/phone/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const described = (input.getAttribute('aria-describedby') ?? '').split(' ');
    expect(described).toHaveLength(2);
    const texts = described.map((id) => document.getElementById(id)?.textContent);
    expect(texts).toContain('10 digits');
    expect(texts).toContain('Enter a valid phone');
  });

  it('links the error via aria-describedby (no live-region role; the summary announces) and clears it when valid', () => {
    const { rerender } = render(
      <Field label="Phone" error="Bad">
        <Input />
      </Field>,
    );
    const errId = screen.getByLabelText(/phone/i).getAttribute('aria-describedby')!;
    expect(document.getElementById(errId)).toHaveTextContent('Bad');
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(
      <Field label="Phone">
        <Input />
      </Field>,
    );
    expect(screen.queryByRole('alert')).toBeNull();
    const input = screen.getByLabelText(/phone/i);
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('marks optional fields visibly and required fields for screen readers only', () => {
    render(
      <>
        <Field label="Notes" optional>
          <Input />
        </Field>
        <Field label="Name">
          <Input />
        </Field>
      </>,
    );
    expect(screen.getByText('(optional)')).toBeVisible();
    const hidden = screen.getByText('(required)');
    expect(hidden.className).toContain('sr-only');
  });

  it('exposes the required state with aria-required (false for optional fields)', () => {
    render(
      <>
        <Field label="Name"><Input /></Field>
        <Field label="Notes" optional><Input /></Field>
      </>,
    );
    expect(screen.getByLabelText(/^name/i)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/^notes/i)).toHaveAttribute('aria-required', 'false');
  });

  it('uses 16px text and a 48px minimum height', () => {
    render(
      <Field label="A">
        <Input />
      </Field>,
    );
    const cls = screen.getByLabelText(/^a/i).className;
    expect(cls).toContain('text-base');
    expect(cls).toContain('min-h-12');
    expect(cls).toContain('rounded-sm');
    expect(cls).toContain('border-stone');
  });

  it('uses the danger border when invalid and passes native attributes through', () => {
    render(
      <Field label="PIN" error="x">
        <Input inputMode="numeric" autoComplete="postal-code" maxLength={6} pattern="[1-9][0-9]{5}" />
      </Field>,
    );
    const input = screen.getByLabelText(/pin/i);
    expect(input.className).toContain('border-danger');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'postal-code');
    expect(input).toHaveAttribute('maxlength', '6');
    expect(input).toHaveAttribute('pattern', '[1-9][0-9]{5}');
  });

  it('supports disabled', () => {
    render(
      <Field label="A">
        <Input disabled />
      </Field>,
    );
    expect(screen.getByLabelText(/^a/i)).toBeDisabled();
  });

  it('works without a Field (own id)', () => {
    render(<Input aria-label="Solo" />);
    expect(screen.getByLabelText('Solo')).toBeInTheDocument();
  });
});

describe('Textarea and Select', () => {
  it('Textarea is wired like Input', () => {
    render(
      <Field label="Address" error="Required">
        <Textarea rows={3} />
      </Field>,
    );
    const ta = screen.getByLabelText(/address/i);
    expect(ta.tagName).toBe('TEXTAREA');
    expect(ta).toHaveAttribute('aria-invalid', 'true');
    expect(ta.className).toContain('text-base');
  });

  it('Select is a native select with options', () => {
    render(
      <Field label="City">
        <Select defaultValue="b">
          <option value="a">A</option>
          <option value="b">B</option>
        </Select>
      </Field>,
    );
    const sel = screen.getByLabelText(/city/i) as HTMLSelectElement;
    expect(sel.tagName).toBe('SELECT');
    expect(sel.value).toBe('b');
    expect(sel.className).toContain('min-h-12');
  });
});

describe('PasswordInput', () => {
  it('toggles the type with an aria-pressed button and keeps the label', () => {
    render(
      <Field label="Password">
        <PasswordInput autoComplete="current-password" />
      </Field>,
    );
    const input = screen.getByLabelText(/password/i, { selector: 'input' }) as HTMLInputElement;
    expect(input.type).toBe('password');
    expect(input).toHaveAttribute('autocomplete', 'current-password');
    const toggle = screen.getByRole('button', { name: /show password/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(input.type).toBe('text');
    const hide = screen.getByRole('button', { name: /hide password/i });
    expect(hide).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(hide);
    expect(input.type).toBe('password');
  });
});

describe('RadioCard', () => {
  function Group() {
    const [v, setV] = useState('online');
    return (
      <fieldset>
        <legend>Payment</legend>
        <RadioCard name="pm" value="online" checked={v === 'online'} onChange={() => setV('online')} title="Pay online" description="UPI, cards" />
        <RadioCard name="pm" value="cod" checked={v === 'cod'} onChange={() => setV('cod')} title="Cash on delivery" />
      </fieldset>
    );
  }
  it('renders radios named by title, with the description in the accessible description', () => {
    render(<Group />);
    const online = screen.getByRole('radio', { name: /pay online/i }) as HTMLInputElement;
    expect(online.checked).toBe(true);
    expect(online).toHaveAccessibleDescription('UPI, cards');
    fireEvent.click(screen.getByRole('radio', { name: /cash on delivery/i }));
    expect(online.checked).toBe(false);
    expect((screen.getByRole('radio', { name: /cash on delivery/i }) as HTMLInputElement).checked).toBe(true);
  });
});

describe('FormError', () => {
  it('is a focusable alert summarising errors, with links to the fields', () => {
    render(
      <FormError
        title="Please fix the following"
        items={[
          { id: 'f-name', message: 'Enter your name' },
          { id: 'f-pin', message: 'Enter a valid PIN' },
        ]}
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('tabindex', '-1');
    expect(alert).toHaveTextContent('Please fix the following');
    expect(screen.getByRole('link', { name: 'Enter your name' })).toHaveAttribute('href', '#f-name');
  });

  it('forwards its ref (for focus management) and renders plain messages', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<FormError ref={ref}>Could not place order</FormError>);
    expect(ref.current).toBe(screen.getByRole('alert'));
    expect(screen.getByRole('alert')).toHaveTextContent('Could not place order');
  });

  it('onItemClick receives the field id and prevents hash navigation', () => {
    const onItemClick = vi.fn();
    render(<FormError items={[{ id: 'f-name', message: 'Enter your name' }]} onItemClick={onItemClick} />);
    const notPrevented = fireEvent.click(screen.getByRole('link', { name: 'Enter your name' }));
    expect(onItemClick).toHaveBeenCalledWith('f-name');
    expect(notPrevented).toBe(false);
  });

  it('renders nothing when there is nothing to say', () => {
    const { container } = render(<FormError items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
