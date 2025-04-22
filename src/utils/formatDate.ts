export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return formattedDate.replace(/\//g, ".").replace(",", "");
};

export const convertToMSK = (utcString: string) => {
  const utcDate = new Date(utcString) as any;
  if (isNaN(utcDate)) return "Invalid date";

  const options = {
      timeZone: "Europe/Moscow",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
  } as any;

  return new Intl.DateTimeFormat("ru-RU", options).format(utcDate);
}