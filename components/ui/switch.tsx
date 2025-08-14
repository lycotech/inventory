"use client";

import * as React from "react";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function Switch({ checked, onCheckedChange, disabled, id, name, className = "", size = "md" }: SwitchProps) {
  const width = size === "sm" ? 28 : size === "lg" ? 48 : 40;
  const height = size === "sm" ? 16 : size === "lg" ? 28 : 22;
  const knob = size === "sm" ? 12 : size === "lg" ? 24 : 18;

  return (
    <button
      id={id}
      name={name}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onCheckedChange(!checked);
        }
      }}
      className={`relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
        checked ? "bg-primary" : "bg-muted"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      style={{ width, height }}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow transition-transform`}
        style={{ width: knob, height: knob, translate: checked ? `${width - knob - 2}px` : "2px" }}
      />
    </button>
  );
}
