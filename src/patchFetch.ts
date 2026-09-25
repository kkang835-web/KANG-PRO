// Ensure window.fetch has a working getter and setter across all environments
(function initFetchPatch() {
  if (typeof window === 'undefined') return;

  // Global error listener to suppress harmless fetch assignment errors
  window.addEventListener('error', (event) => {
    if (event?.message && event.message.includes('Cannot set property fetch of')) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);

  try {
    const rawFetch = window.fetch;
    const boundFetch = function(this: any, ...args: any[]) {
      const ctx = (this === window || !this) ? window : this;
      return rawFetch.apply(ctx, args as [any, any]);
    };
    let activeFetch = boundFetch;

    // Walk entire prototype chain
    let cur: any = window;
    while (cur) {
      try {
        const desc = Object.getOwnPropertyDescriptor(cur, 'fetch');
        if (desc && desc.configurable !== false) {
          Object.defineProperty(cur, 'fetch', {
            get: () => activeFetch,
            set: (val: any) => {
              activeFetch = typeof val === 'function' ? val : boundFetch;
            },
            configurable: true,
            enumerable: true
          });
        }
      } catch (e) {
        // ignore
      }
      cur = Object.getPrototypeOf(cur);
    }

    // Unconditionally define on window itself
    try {
      Object.defineProperty(window, 'fetch', {
        get: () => activeFetch,
        set: (val: any) => {
          activeFetch = typeof val === 'function' ? val : boundFetch;
        },
        configurable: true,
        enumerable: true
      });
    } catch (e) {
      // ignore
    }

    // Also on globalThis
    if (typeof globalThis !== 'undefined' && globalThis !== window) {
      try {
        Object.defineProperty(globalThis, 'fetch', {
          get: () => activeFetch,
          set: (val: any) => {
            activeFetch = typeof val === 'function' ? val : boundFetch;
          },
          configurable: true,
          enumerable: true
        });
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    // ignore
  }
})();

export {};
