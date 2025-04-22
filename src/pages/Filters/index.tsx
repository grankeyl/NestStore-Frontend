//@ts-nocheck

import { ChangeEvent, FC, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import cn from "classnames";
import Checkbox from "@components/ui/checkbox";
import { useFiltersStore } from "@stores/shop.store";
import styles from "./Filters.module.scss";
import UseTelegram from "@hooks/useTelegram";
import { t } from "i18next";
import { capitalizeFirstLetter } from "@utils/capitalizeFirstLetter";
import useGiftTypeImages from "@hooks/useGiftTypeImages";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import axios from "axios";
import { GiftType } from "@types";
import { giftImagesOfTypes, giftTypeDisplayNames } from "@data";
import { getModelPng, regexGiftModal, regexGiftModel, regexGiftType } from "@utils/nftUtils";

const rares = ["common", "rare", "mythical", "legend"];
const Filters: FC = () => {
  const [giftTypeImages] = useGiftTypeImages();

  const sortring = [
    {
      label: t("store.lowToHigh"),
      value: "price_low_to_high",
    },
    {
      label: t("store.highToLow"),
      value: "price_high_to_low",
    },
    {
      label: t("store.recentlyAdded"),
      value: "recently_added",
    },
    {
      label: t("store.oldest"),
      value: "oldest",
    },
  ];

  const filters = useFiltersStore();
  const { 
    from, to, 
    rarity, 
    type, 
    setFrom,
    setTo,
    setRarity,
    setType,
    sort,
    setSort,

    numberFrom,
    numberTo,
    setNumberFrom,
    setNumberTo,

    finModels,
    setFinModels,
  } = useFiltersStore();
  const { register, reset } = useForm({
    defaultValues: {
      to,
      from,
    },
  });
  const { register: registerNumber, reset: resetNumber } = useForm({
    defaultValues: {
      toNumber: numberTo,
      fromNumber: numberFrom,
    },
  });
  const [models, setModels] = useState<any>({});

  const [activeType, setActiveType] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(type);
  const [selectedModels, setSelectedModels] = useState<string[]>(finModels);

  const [isModelFilter, setIsModelFilter] = useState<boolean>(false);
  const [modelFilterGift, setModelFilterGift] = useState<string>('');

  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);
  const [localRarity, setLocalRarity] = useState<string[]>(rarity);
  const [localType, setLocalType] = useState<string[]>(type);
  const [localSort, setLocalSort] = useState(sort);
  const [localNumberFrom, setLocalNumberFrom] = useState(numberFrom);
  const [localNumberTo, setLocalNumberTo] = useState(numberTo);
  const [isResetDisabled, setIsResetDisabled] = useState(true);
  const { webApp } = UseTelegram();
  const location = useLocation();
  const navigate = useNavigate();

  const handleModelChange = (model: string) => {
    setSelectedTypes((prev) => [...prev, activeType]);

    if (selectedTypes.includes(activeType)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== activeType));
    }
    
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  const handleModelChangeSelectAll = () => {
    setSelectedModels((prev) => (prev.length === models.length ? [] : models));
  };

  const handleApply = () => {
    setSort(localSort);
    setFrom(localFrom);
    setTo(localTo);
    setNumberFrom(localNumberFrom);
    setNumberTo(localNumberTo);
    setFinModels(selectedModels);
    
    setType(selectedTypes);
  };

  const handleModelFilter = (giftType: string) => {
    setIsModelFilter(!isModelFilter);
    setModelFilterGift(giftType);
    getModels(giftType);
  }; 

  useEffect(() => {
    if (location.pathname === "/filters") {
      webApp.BackButton.show();
      const handleBack = () => {
        isModelFilter ? setIsModelFilter(false) : navigate(-1);
      };
      webApp.BackButton.onClick(handleBack);
      return () => {
        webApp.BackButton.hide();
        webApp.BackButton.offClick(handleBack);
      };
    } else {
      webApp.BackButton.hide();
    }
  }, [location.pathname, isModelFilter, navigate]);

  useEffect(() => {
    const isAnyFieldFilled = localFrom !== "" || localTo !== "" || localRarity.length > 0 || localType.length > 0 || localSort !== "recently_added" || selectedTypes.length > 0 || selectedModels.length > 0 || localNumberFrom !== "" || localNumberTo !== "" || numberFrom !== "" || numberTo !== "";
    setIsResetDisabled(!isAnyFieldFilled);
  }, [localFrom, localTo, localRarity, localType, localSort, selectedTypes, selectedModels, localNumberFrom, localNumberTo, numberFrom, numberTo]);

  const handlePriceFromChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFromValue = e.target.value;
    const toValue = localTo;
    if (toValue !== "" && parseFloat(newFromValue) > parseFloat(toValue)) {
      return;
    }

    setLocalFrom(newFromValue);
  };

  const handlePriceToChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocalTo(e.target.value);
  };

  const handleNumberFromChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFromValue = e.target.value;
    const toValue = localNumberTo;
    if (toValue !== "" && parseFloat(newFromValue) > parseFloat(toValue)) {
      return;
    }

    setLocalNumberFrom(newFromValue);
  };

  const handleNumberToChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocalNumberTo(e.target.value);
  };

  const handleToBlur = () => {
    if (localFrom !== "" && localTo !== "" && parseFloat(localTo) < parseFloat(localFrom)) {
      setLocalTo(localFrom);
    }
  };

  const handleRareChange = (rare: string) => {
    setLocalRarity((prev) => (prev.includes(rare) ? prev.filter((r) => r !== rare) : [...prev, rare]));
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setLocalSort(e.target.value);
  };

  const getModels = async (type: GiftType) => {
    const name = giftTypeDisplayNames[type];
    setActiveType(name);

    axios
      .get(`https://cdn.changes.tg/gifts/models/${name}/models.json`)
      .then(({ data }) => {
        console.log(data);
        const modelNames = data.map((model: { name: string }) => model.name);
        setModels(modelNames);
      })
      .catch(console.error);
  };

  const handleReset = () => {
    setLocalFrom("");
    setLocalTo("");
    setLocalNumberFrom("");
    setLocalNumberTo("");
    setLocalRarity([]);
    setLocalType([]);
    setSelectedTypes([]);
    setSelectedModels([]);
    setFinModels([]);
    setLocalSort("recently_added");

    setFrom("");
    setTo("");
    setNumberFrom("");
    setNumberTo("");
    setRarity([]);
    setType([]);
    setFinModels([]);
    setSelectedTypes([]);
    setSelectedModels([]);
    setSort("recently_added");

    reset({ from: "", to: "" });
    reset({ numberFrom: "", numberTo: "" });
  };

  return (
    <section className={styles.main}>

      <div className={styles.header}>
        <h1 className={styles.headline}>{t("store.filters")}</h1>
        <button type="reset" className={styles.reset} onClick={handleReset} disabled={isResetDisabled}>
          <img width={8.5} height={10} src="/photos/close.svg" alt="" />
          <span>{t("store.reset")}</span>
        </button>
      </div>

      {!isModelFilter && 
        (
          <form className={styles.form}>
            <label htmlFor="price" className={styles.label}>
              <span>{t("store.sorting")}</span>
            </label>
            <div className={styles.block}>
              <div className={styles.blockHolder}>
                <label htmlFor="giftType" className={styles.label}>
                  <div className={styles.selectHolder}>
                    <select name="giftType" id="giftType" className={styles.item} value={localSort} onChange={handleSortChange}>
                      {sortring.map(({ label, value }) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>
            </div>
            <label htmlFor="price" className={styles.label}>
              <span>{t("store.price")}</span>
            </label>
            <div className={styles.block}>
              <div className={styles.blockHolder}>
                <label htmlFor="from" className={styles.label}>
                  <span>{t("store.from")}</span>
                  <div className={styles.inputHolder}>
                    <input type="number" placeholder="0.00" id="from" className={styles.item} {...register("from")} value={localFrom} onChange={handlePriceFromChange} />
                  </div>
                </label>
                <label htmlFor="to" className={styles.label}>
                  <span>{t("store.to")}</span>
                  <div className={styles.inputHolder}>
                    <input type="number" placeholder="0.00" id="to" className={styles.item} {...register("to")} value={localTo} onChange={handlePriceToChange} onBlur={handleToBlur} />
                  </div>
                </label>
              </div>
            </div>
            <label htmlFor="numberGift" className={styles.label}>
              <span>{t("store.numberGift")}</span>
            </label>
            <div className={styles.block}>
              <div className={styles.blockHolder}>
                <label htmlFor="from" className={styles.label}>
                  <span>{t("store.from")}</span>
                  <div>
                    <input type="number" placeholder="0" id="fromNumber" className={styles.item} {...registerNumber("fromNumber")} value={localNumberFrom} onChange={handleNumberFromChange} />
                  </div>
                </label>
                <label htmlFor="to" className={styles.label}>
                  <span>{t("store.to")}</span>
                  <div>
                    <input type="number" placeholder="0" id="toNumber" className={styles.item} {...registerNumber("toNumber")} value={localNumberTo} onChange={handleNumberToChange} onBlur={handleToBlur} />
                  </div>
                </label>
              </div>
            </div>
            <label htmlFor="type" className={styles.label}>
              <span>{t("store.typeGift")}</span>
            </label>
            <div className={cn(styles.block, styles.listBlock)}>
              <div className={styles.list}>
                {giftImagesOfTypes.map(({ name, cover }) => (
                  <label
                    onClick={() => handleModelFilter(name)}
                    key={name}
                    className={cn(styles.rare, styles.type)}
                    htmlFor={name}
                  >
                    <div className={styles.nameHolder}>
                      <img src={getModelPng(name, cover)} alt="" />
                      <span>{giftTypeDisplayNames[name]}</span>
                    </div>
                    <img src="/photos/store/chevroneRight.svg" alt="" />
                  </label>
                ))}
              </div>
            </div>
          </form>
        )
      }

      {isModelFilter && 
        (
          <form className={styles.form}>
            <label htmlFor="type" className={`${styles.label}, ${styles.filterModelHead}`}>
              <span>{t("store.modelGift")}</span>
              {selectedModels.length === 0 && <b onClick={handleModelChangeSelectAll}>{t("store.filters.selectAll")}</b>}
              {selectedModels.length > 0 && <b onClick={handleModelChangeSelectAll}>{t("store.filters.unselectAll")}</b>}
            </label>
            <div className={cn(styles.block, styles.listBlock)}>
              <div className={styles.list}>
                {models.length > 0 ? (
                  models.map((modelName, index) => (
                    <label 
                      key={`${modelName}-${index}`} 
                      className={cn(styles.rare, styles.type, styles.modelsBlockItem)} 
                      htmlFor={modelName} 
                      onClick={(e) => {
                          handleModelChange(modelName);
                      }}
                    >
                      <div className={styles.nameHolder}>
                        <img 
                          className={styles.modelsImage} 
                          src={`https://cdn.changes.tg/gifts/models/${giftTypeDisplayNames[modelFilterGift]}/png/${regexGiftModel(modelName)}.png`} 
                          alt={modelName} 
                        />
                        <span>{modelName}</span>
                      </div>
                      <Checkbox
                        value={modelName} 
                        type="checkbox" 
                        id={modelName} 
                        name={modelName} 
                        checked={selectedModels.includes(modelName)} 
                        onChange={() => handleModelChange(modelName)} 
                      />
                    </label>
                  ))
                ) : (
                  <p style={{ marginLeft: "12px" }}>{t("app.loading")}</p>
                )}
              </div>
            </div>
          </form>
        )
      }

      <Link to="/" className={styles.button} onClick={handleApply}>
        {t("store.apply")}
      </Link>

    </section>
  );
};

export default Filters;
