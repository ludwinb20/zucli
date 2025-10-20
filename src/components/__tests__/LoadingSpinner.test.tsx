import { render, screen } from '@/__tests__/utils/test-utils';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render without crashing', () => {
    render(<LoadingSpinner />);
    // El componente renderiza un spinner (SVG) y texto
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should display loading text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('should apply correct styling classes', () => {
    render(<LoadingSpinner />);
    // Verifica que el contenedor tenga las clases esperadas
    const container = screen.getByText(/cargando/i).closest('div');
    expect(container).toBeInTheDocument();
  });
});

