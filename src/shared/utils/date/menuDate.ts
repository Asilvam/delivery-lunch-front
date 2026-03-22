const toPadded = (value: number) => `${value}`.padStart(2, '0');

export const addDays = (base: Date, days: number) => {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
};

export const formatIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = toPadded(date.getMonth() + 1);
  const day = toPadded(date.getDate());
  return `${year}-${month}-${day}`;
};

export const formatUiDate = (date: Date) => {
  const day = toPadded(date.getDate());
  const month = toPadded(date.getMonth() + 1);
  const year = `${date.getFullYear()}`.slice(-2);
  return `${day}/${month}/${year}`;
};

export const parseIsoDate = (isoDate: string): Date | null => {
  const [yearText, monthText, dayText] = isoDate.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);
  parsedDate.setHours(0, 0, 0, 0);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
};

export const getMenuDateTimestamp = (menuDate: string): number | null => {
  const [dayText, monthText, yearText] = menuDate.split('/');
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return null;
  }

  const fullYear = year >= 70 ? 1900 + year : 2000 + year;
  const parsedDate = new Date(fullYear, month - 1, day);
  parsedDate.setHours(0, 0, 0, 0);

  if (
    parsedDate.getFullYear() !== fullYear ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate.getTime();
};

