'use client'

import axios from "axios";
import api, { hasCsrfToken, setCsrfToken } from "@/utils/api";
import { createContext, ReactNode, useEffect, useState } from "react";

interface UserSession {
    userId: string;
    userType: string;
    userName: string;
}

interface IAuthContext {
    user: UserSession | null;
    login: (email: string, password: string) => Promise<boolean>;
    signup: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const initialAuthContextData: IAuthContext = {
    user: null,
    login: async () => false,
    logout: async () => {},
    signup: async () => false
};

export const AuthContext = createContext<IAuthContext>(initialAuthContextData);

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState(null);

    const ensureCsrfToken = async (forceRefresh = false) => {
        if (!forceRefresh && hasCsrfToken()) return;

        const { data } = await api.get("/auth/csrf");
        setCsrfToken(data?.csrfToken ?? null);
    };

    useEffect(() => {
        ensureCsrfToken()
        .then(() => api.get("/auth/me"))
        .then((res) => {
            if (res.status === 200) {
                setUser(res.data);
            }
        }).catch((err) => {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
                setUser(null);
                return;
            }

            console.log(err);
        });
    }, []);

    const login = async (email: string, password: string) => {

        try{
            await ensureCsrfToken();
            const res = await api.post("/auth/login", {email, password})
            console.log("login response", res);
            if (res.status === 200) {
                setUser(res.data);
                return true;
            }
            return false
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 403) {
                try {
                    await ensureCsrfToken(true);
                    const retryRes = await api.post("/auth/login", { email, password });

                    if (retryRes.status === 200) {
                        setUser(retryRes.data);
                        return true;
                    }
                } catch (retryErr) {
                    console.log(retryErr);
                }
            }

            console.log(err)
            return false
        }
        
    }

    const signup = async (name: string, email: string, password: string) => {
        try {
            await ensureCsrfToken();
            const res = await api.post("/auth/signup", {
                name,
                email,
                password,
            });

            if (res.status === 200 || res.status === 201) {
                return true;
            }

            return false;
        } catch (err) {
            console.log(err);
            return false;
        }
    };

    const logout = async () => {
        console.log("logout");
        await ensureCsrfToken();
        const res = await api.post("/auth/logout")
        if (res.status === 200) {
            setUser(null);
            setCsrfToken(null);
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, signup }}>
            {children}
        </AuthContext.Provider>
    );
}