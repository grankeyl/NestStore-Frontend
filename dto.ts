//? Создание розыгрыша
//? POST /giveaways/create

//* Тело запроса *//
interface GiveawayCreateDto {
    /** Тип розыгрыша: subscription, subscription_paid_participant, subscription_paid_ticket */
    type: string;

    /** Идентификаторы подарков */
    gift_ids: number[];

    /** ID Telegram-каналов (отрицательные значения) */
    channels: number[];

    /** Максимальное количество участников (0 — без ограничений) */
    quantity_members: number;

    /** Дата и время окончания (ISO 8601) */
    end_time: string;

    /** Стоимость участия (обязательно, если type ≠ subscription) */
    price?: number;
}

//* Ответ *//
// STATUS 200 OK

//----------------------------------------
//? Получение информации о Telegram-канале
//? GET /telegram/channel/<username:string>

//----------------------------------------
//? Получение информации о розыгрыше
//? GET /giveaways/get/<id:number>

//* Ответ *//
interface GiveawayDto {
    /** ID розыгрыша */
    id: number;

    /** Тип розыгрыша */
    type: string;

    /** Идентификаторы подарков */
    gift_ids: number[];

    /** ID Telegram-каналов */
    channels: number[];

    /** Ограничение по количеству участников */
    quantity_members: number;

    /** Текущее количество участников, даже если завершено */
    quantity_members_current: number;

    /** Если розыгрыш завершен, то количество победителей */
    winner_members: number;

    /** Дата и время окончания (ISO 8601) */
    end_time: string;

    /** Стоимость участия */
    price: number;
}

//----------------------------------------
//? Участие в розыгрыше
//? POST /giveaways/join

//* Тело запроса *//
interface GiveawayJoinDto {
    /** ID розыгрыша */
    id: number;

    /** Тип розыгрыша */
    type: string;

    /** Стоимость участия, верну если type ≠ subscription */
    price: number;
}
// TODO: Сделать так, что если type ≠ subscription, то списывать еще баланс