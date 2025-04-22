import { t } from "i18next";

export const giveawayGetRarity = (members: number) => {
  if (members >= 1 && members <= 3) return "rare";
  if (members >= 4 && members <= 8) return "epic";
  if (members >= 9) return "legend";
}

export function giveawayStartCountdown(endTime: string) {
  const end = new Date(endTime).getTime();
  const now = Date.now();
  const timeLeft = end - now;

  if (timeLeft <= 0) return `Закончен`;

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} ${t("store.bid.day")}`;

  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return `${hours}ч ${minutes}м ${seconds}с`;
}