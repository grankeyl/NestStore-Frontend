export const validateBalance = (number: number): number => {
  const str = number.toFixed(20);

  if (str.includes(".")) {
    const [integerPart, decimalPart] = str.split(".");

    const trimmedDecimal = decimalPart.replace(/0+$/, "");

    if (trimmedDecimal.length > 3) {
      return parseFloat(`${integerPart}.${trimmedDecimal.slice(0, 3)}`);
    }
  }

  return number;
};

export const validatePrice = (number: number): number => {
  if (!number) return 0;
  
  const str = number.toFixed(20);

  if (str.includes(".")) {
    const [integerPart, decimalPart] = str.split(".");

    const trimmedDecimal = decimalPart.replace(/0+$/, "");

    if (trimmedDecimal.length > 2) {
      return parseFloat(`${integerPart}.${trimmedDecimal.slice(0, 2)}`);
    }
  }

  return number;
};