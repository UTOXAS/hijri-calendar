function generateCalendar(hijriData) {
    const tbody = document.getElementById('calendar-body');
    tbody.innerHTML = '';

    const hijriMonth = hijriData.hijriMonthName;
    const hijriYear = hijriData.hijriYear;
    const calendar = hijriData.calendar;
    const gregorianStart = calendar[0].gregorian.date;
    const gregorianEnd = calendar[calendar.length - 1].gregorian.date;

    const gregorianStartMonth = gregorianStart.toLocaleString('ar', { month: 'long' });
    const gregorianEndMonth = gregorianEnd.toLocaleString('ar', { month: 'long' });
    const gregorianYear = gregorianStart.getFullYear();
    const gregorianHeader = gregorianStartMonth === gregorianEndMonth
        ? `${gregorianStartMonth} ${gregorianYear} م`
        : `${gregorianStartMonth} - ${gregorianEndMonth} ${gregorianYear} م`;

    document.getElementById('month-year').textContent = `${hijriMonth} ${hijriYear} هـ / ${gregorianHeader}`;

    const firstDayWeekday = (gregorianStart.getDay() + 1) % 7; // Adjust: Sunday = 0 -> 1, Saturday = 6 -> 0
    const daysInMonth = calendar.length;
    const weeks = Math.ceil((daysInMonth + firstDayWeekday) / 7);
    const calendarData = [];

    let dayCounter = 0;
    for (let i = 0; i < weeks; i++) {
        const row = document.createElement('tr');
        const rowData = new Array(7).fill('');
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            const position = i * 7 + j;
            if (position >= firstDayWeekday && dayCounter < daysInMonth) {
                const day = calendar[dayCounter];
                const gregDay = day.gregorian.day;
                const gregMonth = day.gregorian.date.toLocaleString('ar', { month: 'long' });
                const gregYear = day.gregorian.year;
                const isFirstOfGregMonth = gregDay === '1';
                const lastDayOfMonth = new Date(gregYear, day.gregorian.date.getMonth() + 1, 0).getDate();
                const isLastOfGregMonth = gregDay === String(lastDayOfMonth);
                const gregText = `${gregDay}${(isFirstOfGregMonth || isLastOfGregMonth) ? ` ${gregMonth}` : ''}`;

                // Split Hijri and Gregorian into separate lines
                cell.innerHTML = `
                    <div class="hijri-date">${day.hijri.day}</div>
                    <div class="gregorian-date">${gregText}</div>
                `;
                cell.title = `${formatHijriDate(day.hijri.day, hijriMonth, hijriYear)} - ${formatGregorianDate(gregDay, gregMonth, gregYear)}`;

                const today = new Date();
                if (day.gregorian.date.toDateString() === today.toDateString()) {
                    cell.classList.add('current-day');
                }
                rowData[j] = `${day.hijri.day} (${gregText})`; // Keep combined format for CSV/text
                dayCounter++;
            }
            row.appendChild(cell);
        }
        tbody.appendChild(row);
        calendarData.push(rowData);
    }

    return calendarData;
}

function generateCSV(calendarData) {
    const headers = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    let csv = headers.map(h => `"${h}"`).join(',') + '\n';
    calendarData.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    return csv;
}

function generateFormattedText(calendarData, hijriData) {
    const headers = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const hijriMonth = hijriData.hijriMonthName;
    const hijriYear = hijriData.hijriYear;
    const gregorianStart = hijriData.calendar[0].gregorian.date;
    const gregorianEnd = hijriData.calendar[hijriData.calendar.length - 1].gregorian.date;
    const gregorianStartMonth = gregorianStart.toLocaleString('ar', { month: 'long' });
    const gregorianEndMonth = gregorianEnd.toLocaleString('ar', { month: 'long' });
    const gregorianYear = gregorianStart.getFullYear();
    const gregorianHeader = gregorianStartMonth === gregorianEndMonth
        ? `${gregorianStartMonth} ${gregorianYear} م`
        : `${gregorianStartMonth} - ${gregorianEndMonth} ${gregorianYear} م`;

    let text = `${hijriMonth} ${hijriYear} هـ / ${gregorianHeader}\n\n`;
    const columnWidth = 13;
    text += headers.map(h => h.padStart(columnWidth)).join('|') + '\n';
    text += headers.map(() => '-'.repeat(columnWidth)).join('|') + '\n';
    calendarData.forEach(row => {
        text += row.map(cell => cell.padEnd(columnWidth)).join('|') + '\n';
    });
    return text.trim();
}