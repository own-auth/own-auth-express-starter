import { type InputHTMLAttributes, useId, useState } from "react";

type Props = Readonly<
  { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">
>;

export function PasswordField({ label, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = inputProps.id ?? generatedId;

  return (
    <div className="password-field">
      <label htmlFor={inputId}>{label}</label>
      <span className="password-input">
        <input
          {...inputProps}
          id={inputId}
          type={visible ? "text" : "password"}
        />
        <button
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          className="password-toggle"
          onClick={() => setVisible((value) => !value)}
          type="button"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </span>
    </div>
  );
}
