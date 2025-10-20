import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import { PatientModal } from '../PatientModal';
import { mockPatient } from '@/__tests__/utils/mock-data';

// Mock fetch
global.fetch = jest.fn();

describe('PatientModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  it('should render in create mode when no patient is provided', () => {
    render(
      <PatientModal
        isOpen={true}
        onClose={mockOnClose}
        patient={null}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Registrar Nuevo Paciente')).toBeInTheDocument();
  });

  it('should render in edit mode when patient is provided', () => {
    render(
      <PatientModal
        isOpen={true}
        onClose={mockOnClose}
        patient={mockPatient}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Editar Paciente')).toBeInTheDocument();
  });

  it('should display validation errors when required fields are empty', async () => {
    render(
      <PatientModal
        isOpen={true}
        onClose={mockOnClose}
        patient={null}
        onSave={mockOnSave}
      />
    );

    const submitButton = screen.getByText('Registrar Paciente');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/El nombre es requerido/i)).toBeInTheDocument();
    });
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <PatientModal
        isOpen={true}
        onClose={mockOnClose}
        patient={null}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should populate form fields when editing a patient', () => {
    render(
      <PatientModal
        isOpen={true}
        onClose={mockOnClose}
        patient={mockPatient}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByDisplayValue(mockPatient.firstName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockPatient.lastName)).toBeInTheDocument();
  });
});

