export const debounce = (function () {
    let timer: ReturnType<typeof setTimeout>;
    return function (callback: () => void, ms: number | undefined) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();
