import React, { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { useModal } from '../use-modal';

function Harness() {
  const ref = useRef<HTMLDivElement>(null);
  useModal(true, ref, () => {});
  return (
    <div ref={ref} tabIndex={-1}>
      <a href="/skip" tabIndex={-1}>
        skipped link
      </a>
      <div hidden>
        <button>hidden button</button>
      </div>
      <button style={{ display: 'none' }}>display none</button>
      <button>first</button>
      <button>last</button>
    </div>
  );
}

describe('useModal focusables', () => {
  it('ignores tabindex=-1 anchors and non-rendered elements when trapping', async () => {
    render(<Harness />);
    expect(screen.getByText('first')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByText('last')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByText('first')).toHaveFocus(); // wrapped, never landing on the excluded ones
    await userEvent.tab({ shift: true });
    expect(screen.getByText('last')).toHaveFocus();
  });
});
