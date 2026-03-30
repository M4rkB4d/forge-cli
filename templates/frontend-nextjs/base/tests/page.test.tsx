import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from './render';
import Home from '@/app/page';

describe('Home page', () => {
  it('renders the heading and intro text', () => {
    renderWithProviders(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
    expect(screen.getByText('Start building your application.')).toBeDefined();
  });
});
