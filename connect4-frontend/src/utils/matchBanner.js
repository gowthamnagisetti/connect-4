export function initMatchBanner() {
    if (typeof window === 'undefined') return;
    if ((window.__matchBannerInitialized)) return;
    window.__matchBannerInitialized = true;

    function show(detail) {
        const wrap = document.createElement('div');
        wrap.className = 'match-banner';
        const pill = document.createElement('div');
        pill.className = 'match-pill';
        const you = detail && detail.you ? detail.you : 'You';
        const opp = detail && detail.opponent && detail.opponent.username ? detail.opponent.username : (detail && detail.opponent ? detail.opponent : 'Opponent');
        pill.textContent = `${you}  vs  ${opp}`;
        wrap.appendChild(pill);
        document.body.appendChild(wrap);
        setTimeout(() => { try { wrap.remove(); } catch (e) { } }, 3000);
    }

    window.addEventListener('connect4:matched', (e) => {
        try { show(e.detail || {}); } catch (e) { }
    });
}
