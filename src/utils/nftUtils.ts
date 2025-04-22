import { giftTypeDisplayNames } from "@data";
import { giftTypeBackdrops } from "@data/gifts";

export function regexGiftTypePng(s: string) {
    if (!s) { return; }
    return s.toLowerCase().replace(/'/g, "").replace(/\s+/g, "_").replace("-", "").replace("’", "'");
}

export function regexGiftType(s: string) {
    if (!s) { return; }
    return s.toLowerCase().replace(/'/g, "").replace(/\s+/g, "").replace("-", "").replace("’", "'");
}

export function regexGiftModel(s: string) {
    if (!s) { return; }
    return s.replace("’", "'");
}

export function getNftBackground(background_name: any): any {
    if (typeof background_name !== 'string') return {};
    try {
      return giftTypeBackdrops[background_name.replace(/\s/g, '') as keyof typeof giftTypeBackdrops] || {};
    } catch {
      return {};
    }
  }

export function getNftLottie(type: string, number: any) {
    return `https://nft.fragment.com/gift/${regexGiftType(type)}-${number}.lottie.json`;
}

export const getSymbolLottie = (type: string, patternName: string) => {
    return `https://cdn.changes.tg/gifts/patterns/${type}/png/${patternName}.png`
};

export const getModelLottie = (type: string, modelName: string) => {
    return `https://cdn.changes.tg/gifts/models/${type}/lottie/${regexGiftModel(modelName)}.json`;
};

export const getModelPng = (type: string, modelName: string) => {
    const newTyping = regexGiftTypePng(type.replace(/-/g, ''));
    const newType = giftTypeDisplayNames[newTyping as keyof typeof giftTypeDisplayNames];
    return `https://cdn.changes.tg/gifts/models/${newType}/png/${regexGiftModel(modelName)}.png`;
};