import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { UserContext, type User } from './UserContextDef';

const API_URL = import.meta.env.VITE_API_URL;

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        // Try to get user data from localStorage on initial load
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Update localStorage whenever user state changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);

    const login = async (username: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/api/User/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            const userData = await response.json();
            setUser(userData);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <UserContext.Provider value={{ user, setUser, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}