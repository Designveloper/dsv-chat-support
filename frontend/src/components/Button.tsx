import React from "react";
import "./Button.scss";

export interface ButtonProps {
  label: string;
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  label,
  type = "button",
  className = "",
  onClick,
  disabled = false,
  variant = "primary",
  size = "medium",
  fullWidth = false,
}) => {
  const buttonClasses = [
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    `${fullWidth ? "btn--full" : ""}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
};

export default Button;
