// Generate calendar for a given month and year
function generateCalendar(hijriData, gregorianDate) {
    const tbody = document.getElementById('calendar-body');
    tbody.innerHTML = '';

    const hijriMonth = hijriData.HijriMonthName;
    const hijriYear = hijriData.HijriYear;
    const gregorianMonth = gregorianDate.toLocaleString('ar', { month: 'long' });
    const gregorianYear = gregorianDate.getFullYear();

    document.getElementById('month-year').textContent = `${hijriMonth} ${hijriYear} هـ - ${gregorianMonth} ${gregorianYear} م`;

    const daysInMonth = 30; // Simplified for Hijri (API doesn't provide exact days)
    let dayCounter = 1;
    const weeks = Math.ceil(daysInMonth / 7);

    for (let i = 0; i < weeks; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            if (dayCounter <= daysInMonth) {
                const gregDay = new Date(gregorianDate);
                gregDay.setDate(gregorianDate.getDate() + dayCounter - 1);
                const gregText = gregDay.getDate();
                cell.textContent = `${dayCounter} (${gregText})`;

                // Highlight current day
                const today = new Date();
                if (gregDay.toDateString() === today.toDateString()) {
                    cell.classList.add('current-day');
                }
                dayCounter++;
            }
            row.appendChild(cell);
        }
        tbody.appendChild(row);
    }
}

// Navigate to previous month
function prevMonth(currentDate) {
    currentDate.setMonth(currentDate.getMonth() - 1);
    return currentDate;
}

// Navigate to next month
function nextMonth(currentDate) {
    currentDate.setMonth(currentDate.getMonth() + 1);
    return currentDate;
}