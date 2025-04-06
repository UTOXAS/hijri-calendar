// Format Hijri date string
function formatHijriDate(hijriDay, hijriMonth, hijriYear) {
    return `${hijriDay} ${hijriMonth} ${hijriYear} هـ`;
}

// Format Gregorian date string
function formatGregorianDate(gregorianDay, gregorianMonth, gregorianYear) {
    return `${gregorianDay} ${gregorianMonth} ${gregorianYear} م`;
}

// Cache data in localStorage
function cacheData(key, data, expirationHours = 24) {
    const now = new Date().getTime();
    const item = {
        value: data,
        expiry: now + expirationHours * 60 * 60 * 1000,
    };
    localStorage.setItem(key, JSON.stringify(item));
}

// Retrieve cached data
function getCachedData(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    const item = JSON.parse(itemStr);
    const now = new Date().getTime();
    if (now > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}