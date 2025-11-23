import { createContext } from 'react';

export interface User {
    id: number;
    username: string;
    email: string;
    displayName?: string;
    profilePictureUrl?: string;
    createdAt: string;
    lastLoginAt?: string;
}

export interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);