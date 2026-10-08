import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { BackHandler } from 'react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';

// Pages under (tabs)/pages are hidden tab screens, and a tab navigator's back
// action goes to the first tab rather than the previous page. So we track the
// visited paths ourselves and navigate back through them.

const TAB_ROOTS = ['/', '/parks', '/profile'];
const MAX_HISTORY = 50;

type NavHistoryValue = {
  canGoBack: boolean;
  goBack: () => void;
};

const NavHistoryContext = createContext<NavHistoryValue | null>(null);

export const isTabRoot = (pathname: string) => TAB_ROOTS.includes(pathname);

export const NavHistoryProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const segments = useSegments();
  const router = useRouter();
  const history = useRef<string[]>([]);

  useEffect(() => {
    if (segments[0] !== '(tabs)') return;
    const stack = history.current;

    // Landing on a tab root starts a fresh trail from that tab
    if (isTabRoot(pathname)) {
      history.current = [pathname];
      return;
    }
    if (stack[stack.length - 1] === pathname) return;
    // Returning to the previous page (e.g. via a link) is the same as going back
    if (stack[stack.length - 2] === pathname) {
      stack.pop();
      return;
    }
    stack.push(pathname);
    if (stack.length > MAX_HISTORY) stack.shift();
  }, [pathname, segments]);

  const goBack = useCallback(() => {
    const stack = history.current;
    stack.pop();
    const prev = stack[stack.length - 1];
    if (!prev) stack.push('/');
    router.navigate((prev ?? '/') as any);
  }, [router]);

  // Android hardware back follows the same history
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isTabRoot(pathname)) return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [pathname, goBack]);

  const value = useMemo(() => ({ canGoBack: !isTabRoot(pathname), goBack }), [pathname, goBack]);

  return <NavHistoryContext.Provider value={value}>{children}</NavHistoryContext.Provider>;
};

export const useNavHistory = () => {
  const context = useContext(NavHistoryContext);
  if (!context) {
    throw new Error('useNavHistory must be used within NavHistoryProvider');
  }
  return context;
};
