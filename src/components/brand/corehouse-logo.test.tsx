import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CorehouseLogo } from './corehouse-logo';

describe('CorehouseLogo', () => {
  it('renders the stepped wordmark and optional tagline', () => {
    const { container } = render(<CorehouseLogo showTagline />);

    expect(container.textContent).toContain('core');
    expect(container.textContent).toContain('house');
    expect(screen.getByText('Pilates Studio')).toBeInTheDocument();
  });

  it('can hide the tagline for compact header usage', () => {
    render(<CorehouseLogo showTagline={false} />);

    expect(screen.queryByText('Pilates Studio')).not.toBeInTheDocument();
  });
});
