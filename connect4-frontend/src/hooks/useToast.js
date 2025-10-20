import { useCallback } from 'react';

// Minimal DOM toast system — side-effectful but easy to use from components.
export default function useToast() {
    function ensureContainer() {
        let wrap = document.querySelector('.toast-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'toast-wrap';
            document.body.appendChild(wrap);
        }
        return wrap;
    }

    const push = useCallback((text, opts = {}) => {
        const { ttl = 4200, level = 'info' } = opts;
        const wrap = ensureContainer();
        const el = document.createElement('div');
        el.className = `toast ${level === 'success' ? 'success' : level === 'warn' ? 'warn' : level === 'error' ? 'error' : ''}`;
        el.textContent = text;
        wrap.appendChild(el);

        // remove after ttl
        const t = setTimeout(() => {
            el.style.transition = 'opacity .18s ease, transform .18s ease';
            el.style.opacity = '0';
            el.style.transform = 'translateX(6px) scale(.98)';
            setTimeout(() => { try { wrap.removeChild(el); } catch { } }, 200);
        }, ttl);

        // allow manual dismiss on click
        el.addEventListener('click', () => {
            clearTimeout(t);
            try { el.remove(); } catch { }
        });
    }, []);

    return { push };
}