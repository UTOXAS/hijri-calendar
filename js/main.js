document.addEventListener('DOMContentLoaded', async () => {
    const loading = document.getElementById('loading');
    let currentDate = new Date();

    async function loadCalendar() {
        loading.style.display = 'block';
        try {
            const hijriData = await fetchHijriDate();
            generateCalendar(hijriData, currentDate);
        } catch (error) {
            alert('حدث خطأ أثناء تحميل التقويم. حاول مرة أخرى لاحقًا.');
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
});