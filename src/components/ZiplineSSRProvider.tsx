import { createContext, useContext } from 'react';

export const NodeCastSSRContext = createContext<any>(null);

export function useSsrData<T>(): T {
  const ctx = useContext(NodeCastSSRContext);

  return ctx as T;
}

export default function NodeCastSSRProvider({
  children,
  ssrData,
}: {
  children: React.ReactNode;
  ssrData: any;
}) {
  return <NodeCastSSRContext.Provider value={ssrData}>{children}</NodeCastSSRContext.Provider>;
}
