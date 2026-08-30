import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Register } from './Register';

describe('Register Component', () => {
  it('renders all form fields and reference UI elements correctly', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Left sidebar branding & features
    expect(screen.getByText('GRIDY')).toBeInTheDocument();
    expect(screen.getByText(/Register as/i)).toBeInTheDocument();
    expect(screen.getByText('CREDENTIALS VERIFICATION')).toBeInTheDocument();
    expect(screen.getByText('ADMIN ACCESS TIERS')).toBeInTheDocument();
    expect(screen.getByText('SECURITY AUDIT COMPLIANCE')).toBeInTheDocument();

    // Right form headings
    expect(screen.getByText('Administrative Registration')).toBeInTheDocument();
    expect(
      screen.getByText('Enter your authorization code and personal details to begin.')
    ).toBeInTheDocument();

    // Inputs
    expect(screen.getByPlaceholderText('Juan De La Cruz')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('juandelacruz@gmail.com')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('••••••••')).toHaveLength(2);

    // Affirmation and submit
    expect(screen.getByLabelText(/I affirm that I am an authorized employee/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create admin account/i })).toBeInTheDocument();

    // Login link
    expect(screen.getByRole('link', { name: /login here/i })).toHaveAttribute('href', '/login');
  });

  it('validates password mismatch before submission', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const fullNameInput = screen.getByPlaceholderText('Juan De La Cruz');
    const emailInput = screen.getByPlaceholderText('juandelacruz@gmail.com');
    const [passwordInput, confirmPasswordInput] = screen.getAllByPlaceholderText('••••••••');
    const affirmationCheckbox = screen.getByLabelText(/I affirm that I am an authorized employee/i);
    const submitButton = screen.getByRole('button', { name: /create admin account/i });

    fireEvent.change(fullNameInput, { target: { value: 'Test Admin' } });
    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Different123!' } });
    fireEvent.click(affirmationCheckbox);

    fireEvent.click(submitButton);

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('validates affirmation requirement before submission', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const fullNameInput = screen.getByPlaceholderText('Juan De La Cruz');
    const emailInput = screen.getByPlaceholderText('juandelacruz@gmail.com');
    const [passwordInput, confirmPasswordInput] = screen.getAllByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /create admin account/i });

    fireEvent.change(fullNameInput, { target: { value: 'Test Admin' } });
    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });

    fireEvent.click(submitButton);

    expect(
      await screen.findByText('You must affirm that you are an authorized employee of the district authority.')
    ).toBeInTheDocument();
  });
});
