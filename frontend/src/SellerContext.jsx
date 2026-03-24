import { createContext, useContext, useState, useEffect } from "react";

const SellerContext = createContext();

export function SellerProvider({ children }) {
    const [isSeller, setIsSeller] = useState(() => {
        const role = localStorage.getItem('role');
        return role === 'seller' || role === 'admin';
    });
    useEffect(() => {
        const existingRole = localStorage.getItem("role");
        if (!existingRole) {
            localStorage.setItem("role", isSeller ? "admin" : "buyer");
        }
    }, [isSeller]);
    return (
        <SellerContext.Provider value={{ isSeller, setIsSeller }}>
            {children}
        </SellerContext.Provider>
    );
}

export function useSeller() {
    return useContext(SellerContext);
}
