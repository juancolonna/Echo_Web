'use client'

import { createContext, useState, ReactNode } from "react";

interface ICounter {
  count: number;
  increment: () => void;
}

const initialCounterData: ICounter = {
    count: 0,
    increment: () => {},
};

export const CounterContext = createContext<ICounter>(initialCounterData);

function CounterProvider({ children }: { children: ReactNode }) {
    const [count, setCount] = useState(0);
    
    const increment = () => {
        setCount(count => count + 1);
    };

    return (
        <CounterContext.Provider value={{ count, increment }}>
            {children}
        </CounterContext.Provider>
    );
}

export default CounterProvider;