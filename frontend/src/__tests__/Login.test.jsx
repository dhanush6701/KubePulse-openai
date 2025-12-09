import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

describe('Login Component', () => {
    it('renders login form', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
        expect(screen.getByText(/KubePulse Login/i)).toBeDefined();
        expect(screen.getByPlaceholderText(/admin@kubepulse.local/i)).toBeDefined();
    });
});
