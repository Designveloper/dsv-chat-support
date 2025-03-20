import React, { useState } from "react";
import "./Input.scss";

export interface InputProps {
  id: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: "small" | "medium" | "large";
}

const Input: React.FC<InputProps> = ({
  id,
  type = "text",
  label,
  value,
  onChange,
  placeholder = "",
  className = "",
  required = false,
  disabled = false,
  error,
  helperText,
  fullWidth = false,
  size = "medium",
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputClasses = [
    "input__field",
    `input__field--${size}`,
    fullWidth ? "input__field--full-width" : "",
    isFocused ? "input__field--focused" : "",
    error ? "input__field--error" : "",
    disabled ? "input__field--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const containerClasses = ["input", fullWidth ? "input--full-width" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={id} className="input__label">
          {label}
          {required && <span className="input__required">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={inputClasses}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {helperText && !error && (
        <div className="input__helper">{helperText}</div>
      )}
      {error && <div className="input__error">{error}</div>}
    </div>
  );
};

export default Input;
