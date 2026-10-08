import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "blue" | "danger" | "super" | "gold" | "white" | "outline" | "ghost";

/** Solid variants sit on a 4px "ledge" and sink into it when pressed. */
const SOLID = "shadow-[0_4px_0_var(--ledge)] hover:brightness-110 active:translate-y-1 active:shadow-none";

const VARIANTS: Record<Variant, string> = {
  primary: `bg-primary text-on-primary [--ledge:rgb(var(--primary-shadow))] ${SOLID}`,
  blue: `bg-macaw text-on-primary [--ledge:rgb(var(--macaw-shadow))] ${SOLID}`,
  danger: `bg-cardinal text-on-primary [--ledge:rgb(var(--cardinal-shadow))] ${SOLID}`,
  super: `bg-super text-white [--ledge:#2B36B3] ${SOLID}`,
  gold: `bg-bee text-[#6B4600] [--ledge:#E5A000] ${SOLID}`,
  white: `bg-white text-owl [--ledge:rgba(0,0,0,0.2)] ${SOLID}`,
  outline:
    "border-2 border-b-4 border-line bg-bg text-muted hover:bg-surface active:translate-y-[2px] active:border-b-2",
  ghost: "text-macaw hover:brightness-125",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth = false,
  className,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const isSolid = variant !== "outline" && variant !== "ghost";
  return (
    <button
      type={type}
      disabled={disabled}
      className={clsx(
        "label-caps inline-flex h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-4 text-[15px]",
        "transition-[transform,box-shadow,filter,background-color] duration-75",
        isSolid && "mb-1", // room for the ledge
        fullWidth && "w-full",
        disabled
          ? clsx(
              "cursor-not-allowed",
              // A disabled solid button looks pressed-in and greyed out.
              isSolid && "translate-y-1 bg-line text-muted",
              variant === "outline" && "border-2 border-b-4 border-line bg-bg text-muted opacity-60",
              variant === "ghost" && "text-muted",
            )
          : VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}
