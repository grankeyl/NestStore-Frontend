import { t } from "i18next";

export function startCountdownAuctionDays(endTime: string) {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const timeLeft = end - now;

    if (timeLeft <= 0) return `0 ${t("store.bid.day")}`;

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

    return `${days} ${t("store.bid.day")}`;
}

export function startCountdownAuctionHours(endTime: string) {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const timeLeft = end - now;

    if (timeLeft <= 0) return `0ч 0м 0с`;

    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return `${hours}ч ${minutes}м ${seconds}с`;
}