export const debounce = (function () {
    let timer: NodeJS.Timeout;
    return function (callback: () => void, ms: number | undefined) {
        if (!timer) clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();
