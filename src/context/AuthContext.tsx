import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../config/firebase";

type AuthContextType = {
    user: User | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>( { user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar se já existe um usuário autenticado imediatamente
        // Isso garante que o estado seja restaurado rapidamente ao reabrir o app
        const checkCurrentUser = async () => {
            try {
                // Aguardar um pouco para garantir que o Firebase Auth foi inicializado
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const currentUser = auth.currentUser;
                if (currentUser) {
                    console.log('✅ Usuário já autenticado encontrado:', currentUser.uid);
                    setUser(currentUser);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Erro ao verificar usuário atual:', error);
            }
        };

        checkCurrentUser();

        // Listener para mudanças no estado de autenticação
        // Este listener será chamado quando o Firebase restaurar a sessão
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log('🔐 onAuthStateChanged chamado:', firebaseUser ? firebaseUser.uid : 'null');
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
