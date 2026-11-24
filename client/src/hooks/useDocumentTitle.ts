import { useEffect } from 'react';

export function useDocumentTitle(title?: string, preserveOnUnmount = false) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | Zilo Store`;
    } else {
      document.title = 'Zilo - Siêu thị công nghệ & Mua sắm thông minh';
    }

    return () => {
      if (!preserveOnUnmount) {
        document.title = prevTitle;
      }
    };
  }, [title, preserveOnUnmount]);
}
