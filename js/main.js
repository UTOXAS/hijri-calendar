document.addEventListener('DOMContentLoaded', async () => {
    const loading = document.getElementById('loading');
    const errorAlert = document.getElementById('error-alert');
    let currentCalendarData = [];

    async function loadCalendar() {
        loading.style.display = 'block';
        errorAlert.classList.add('d-none');
        try {
            const hijriData = await fetchHijriDateToday();
            currentCalendarData = generateCalendar(hijriData);
        } catch (error) {
            console.error('فشل في تحميل التقويم:', error);
            errorAlert.textContent = 'تعذر تحميل التقويم بسبب مشكلة في البيانات. الرجاء المحاولة مرة أخرى لاحقًا أو التواصل مع الدعم إذا استمرت المشكلة.';
            errorAlert.classList.remove('d-none');
        } finally {
            loading.style.display = 'none';
        }
    }

    await loadCalendar();

    document.getElementById('copy-csv').addEventListener('click', async () => {
        try {
            const csv = generateCSV(currentCalendarData);
            await navigator.clipboard.writeText(csv);
            alert('تم نسخ التقويم كـ CSV');
        } catch (err) {
            console.error('فشل في النسخ كـ CSV:', err);
        }
    });

    document.getElementById('copy-text').addEventListener('click', async () => {
        try {
            const hijriData = await fetchHijriDateToday();
            const text = generateFormattedText(currentCalendarData, hijriData);
            await navigator.clipboard.writeText(text);
            alert('تم نسخ التقويم كـ نص');
        } catch (err) {
            console.error('فشل في النسخ كـ نص:', err);
        }
    });
});