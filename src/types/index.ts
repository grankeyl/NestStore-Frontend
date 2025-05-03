import { giftTypeDisplayNames, giftTypes } from "@data";

export type ItemType = (typeof giftTypes)[number];
export type OrderType = "all" | "buy" | "sell" | "closed";
export type StatusType = "on_market" | "gift_received" | "gift_transferred" | "buy" | "seller_accept";
export type RarityType = "common" | "rare" | "mythical" | "legend";

export type GiftType = keyof typeof giftTypeDisplayNames;

export interface IUserGift {
  id: number;
  image_url: string;
  type: string;
  price: number;
  number: number;
  model: number;
  pattern: number;
  background: number;
  rarity: RarityType;
  is_active: boolean;
}

export interface IGift {
  id: string;
  number: number;
  is_active: boolean;
  type: string;
  price: number;
  model_name: string,
  pattern_name: string,
  background_name: string,
  model: any,
  pattern: any,
  background: any,
  rarity: RarityType;
  seller_id: number;
  status: StatusType;
  created_order_date: string;
  completed_order_date: string;
  seller_name: string;
  buyer_name: string;
  min_step: number;
  auction_end_time: string;
  is_vip: boolean;
  bids: any[];
}

export interface IStar {
  id: number;
  amount: number;
  price: number;
  seller_id: number;
  buyer_id: number;
  status: StatusType;
  created_order_date: string;
  completed_order_date: string;
  created_at: string;
}

export interface IOrder extends IGift {
  id: any;
  number: number;
  image_url: string;
  type: string;
  price: number;
  model: number;
  pattern: number;
  background: number;
  rarity: RarityType;
  status: StatusType;
  created_order_date: string;
  completed_order_date: string;
}

export interface IUserProfile {
  id: number;
  username: string | null;
  first_name: string | null;
  balance: number;
  commission: number;
  deposit_comment: string;
  referral_link: string;
  count_referrals: string;
  is_premium: boolean;
}

export type GiftTypeImages = {
  [key in GiftType]: string[];
};
