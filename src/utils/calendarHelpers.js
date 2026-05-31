export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

export const generateMonthlyDays = (selectedYear, selectedMonth) => {
  const days = [];
  const daysCount = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayIndex = getFirstDayOfMonth(selectedYear, selectedMonth);

  // Padding days from the previous month
  const prevMonthDaysCount = getDaysInMonth(
    selectedMonth === 0 ? selectedYear - 1 : selectedYear,
    selectedMonth === 0 ? 11 : selectedMonth - 1
  );

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    const prevMon = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const dayNum = prevMonthDaysCount - i;
    const dateString = `${prevYear}-${String(prevMon + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    days.push({
      date: dateString,
      dayNum,
      isCurrentMonth: false,
      formattedDate: new Date(prevYear, prevMon, dayNum).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    });
  }

  // Active month days
  for (let dayNum = 1; dayNum <= daysCount; dayNum++) {
    const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    days.push({
      date: dateString,
      dayNum,
      isCurrentMonth: true,
      formattedDate: new Date(selectedYear, selectedMonth, dayNum).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    });
  }

  // Padding days from the next month to fill grid
  const remainingCells = 42 - days.length;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    const nextMon = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const dateString = `${nextYear}-${String(nextMon + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    days.push({
      date: dateString,
      dayNum,
      isCurrentMonth: false,
      formattedDate: new Date(nextYear, nextMon, dayNum).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    });
  }

  return days;
};
