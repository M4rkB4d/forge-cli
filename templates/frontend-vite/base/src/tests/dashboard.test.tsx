import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from './render';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

describe('DashboardPage', () => {
  it('renders heading and intro text', () => {
    renderWithProviders(<DashboardPage />);

    expect(screen.getByRole('heading', { level: 2, name: 'Dashboard' })).toBeDefined();
    expect(screen.getByText('Start building your application here.')).toBeDefined();
  });
});
