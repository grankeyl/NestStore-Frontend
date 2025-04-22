import { ComponentPropsWithoutRef, FC } from "react";
import { UseFormRegister, FieldValues } from "react-hook-form";
import styles from "./Checkbox.module.scss";

interface Props extends ComponentPropsWithoutRef<"input"> {
  id: string;
  name: string;
  type?: "switch" | "checkbox";
  register?: UseFormRegister<FieldValues>;
  checked?: boolean;
}

const Checkbox: FC<Props> = ({
  id,
  type = "switch",
  name,
  register = () => {},
  onChange,
  checked,
}) => {
  const handleClick = () => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) input.click();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLLabelElement>) => {
    if (event.key !== "Enter") return;
    const input = event.currentTarget.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    if (input) input.click();
  };

  if (type === "checkbox") {
    return (
      <label
        onClick={handleClick}
        tabIndex={0}
        htmlFor={id}
        onKeyDown={handleKeyDown}
        className={styles.holder}
      >
        <input
          onChange={onChange}
          {...register(name)}
          tabIndex={-1}
          name={name}
          className={styles.checkboxInput}
          type="checkbox"
          id={id}
          checked={checked}
        />
        <label>
          <span className={styles.checkbox} />
          <svg
            width="9"
            height="7"
            viewBox="0 0 9 7"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 3.23077L2.71147 5.16166C3.10752 5.60848 3.80432 5.61093 4.20349 5.16691L7.5 1.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </label>
      </label>
    );
  }

  return (
    <label
      tabIndex={0}
      className={styles.toggle}
      htmlFor={id}
      role="button"
      onKeyDown={handleKeyDown}
    >
      <input
        onChange={onChange}
        {...register(name)}
        tabIndex={-1}
        name={name}
        type="checkbox"
        className={styles.toggle__input}
        id={id}
        checked={checked}
      />
      <span className={styles.toggleTrack}>
        <span className={styles.toggleIndicator}>
          <span className={styles.checkMark} />
        </span>
      </span>
    </label>
  );
};

export default Checkbox;
