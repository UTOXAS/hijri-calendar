document.addEventListener('DOMContentLoaded', async () => {
    const loading = document.getElementById('loading');
    const errorAlert = document.getElementById('error-alert');
    let currentHijriMonth = 'شَوّال'; // Default to Shawwal
    let currentHijriYear = '1446';   // Default to 1446 H
    let currentCalendarData = [];

    async function loadCalendar() {
        loading.style.display = 'block';
        errorAlert.classList.add('d-none');
        try {
            const hijriData = await fetchHijriDate(currentHijriMonth, currentHijriYear);
            currentCalendarData = generateCalendar(hijriData, hijriData.GregorianStart);
        } catch (error) {
            console.error('فشل في تحميل التقويم:', error);
            errorAlert.textContent = 'حدث خطأ أثناء تحميل التقويم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.';
            errorAlert.classList.remove('d-none');
        } finally {
            loading.style.display = 'none';
        }
    }

    await loadCalendar();

    document.getElementById('prev-month').addEventListener('click', async () => {
        const { month, year } = prevMonth(currentHijriMonth, currentHijriYear);
        currentHijriMonth = month;
        currentHijriYear = year;
        await loadCalendar();
    });

    document.getElementById('next-month').addEventListener('click', async () => {
        const { month, year } = nextMonth(currentHijriMonth, currentHijriYear);
        currentHijriMonth = month;
        currentHijriYear = year;
        await loadCalendar();
    });

    document.getElementById('copy-csv').addEventListener('click', async () => {
        try {
            const hijriData = await fetchHijriDate(currentHijriMonth, currentHijriYear);
            const csv = generateCSV(currentCalendarData, hijriData, hijriData.GregorianStart);
            await navigator.clipboard.writeText(csv);
            alert('تم نسخ التقويم كـ CSV');
        } catch (err) {
            console.error('فشل في النسخ كـ CSV:', err);
        }
    });

    document.getElementById('copy-text').addEventListener('click', async () => {
        try {
            const hijriData = await fetchHijriDate(currentHijriMonth, currentHijriYear);
            const text = generateFormattedText(currentCalendarData, hijriData, hijriData.GregorianStart);
            await navigator.clipboard.writeText(text);
            alert('تم نسخ التقويم كـ نص');
        } catch (err) {
            console.error('فشل في النسخ كـ نص:', err);
        }
    });
});