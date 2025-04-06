document.addEventListener('DOMContentLoaded', async () => {
    const loading = document.getElementById('loading');
    const errorAlert = document.getElementById('error-alert');
    let currentDate = new Date();
    let currentCalendarData = [];

    async function loadCalendar() {
        loading.style.display = 'block';
        errorAlert.classList.add('d-none');
        try {
            if (isNaN(currentDate.getTime())) {
                console.error('currentDate غير صالح:', currentDate);
                currentDate = new Date();
            }
            const hijriData = await fetchHijriDate(currentDate);
            currentCalendarData = generateCalendar(hijriData, currentDate);
            const newGregorianStart = new Date(hijriData.GregorianStart);
            if (isNaN(newGregorianStart.getTime())) {
                console.error('GregorianStart غير صالح:', hijriData.GregorianStart);
                currentDate = new Date();
            } else {
                currentDate = newGregorianStart;
            }
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
        currentDate = prevMonth(currentDate);
        await loadCalendar();
    });

    document.getElementById('next-month').addEventListener('click', async () => {
        currentDate = nextMonth(currentDate);
        await loadCalendar();
    });

    document.getElementById('copy-csv').addEventListener('click', async () => {
        try {
            const hijriData = await fetchHijriDate(currentDate);
            const csv = generateCSV(currentCalendarData, hijriData, currentDate);
            await navigator.clipboard.writeText(csv);
            alert('تم نسخ التقويم كـ CSV');
        } catch (err) {
            console.error('فشل في النسخ كـ CSV:', err);
        }
    });

    document.getElementById('copy-text').addEventListener('click', async () => {
        try {
            const hijriData = await fetchHijriDate(currentDate);
            const text = generateFormattedText(currentCalendarData, hijriData, currentDate);
            await navigator.clipboard.writeText(text);
            alert('تم نسخ التقويم كـ نص');
        } catch (err) {
            console.error('فشل في النسخ كـ نص:', err);
        }
    });
});