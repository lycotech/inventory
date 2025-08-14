"use client";

import { useState } from "react";

type User = { id: number; username: string; role: string; profileImageUrl?: string };

export function UserAvatar({ user, size = 32 }: { user: User; size?: number }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = (user?.username || "U")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "U")
    .join("");

  const dim = `${size}px`;
  const fontSize = Math.max(10, Math.floor(size * 0.4));
  const showImg = !!user?.profileImageUrl && !imgErr;

  return (
    <div
      aria-label={user?.username || "User"}
      title={user?.username}
      className="relative inline-flex select-none items-center justify-center rounded-full bg-muted text-foreground/80 border overflow-hidden"
      style={{ width: dim, height: dim, fontSize }}
    >
      {!showImg && <span>{initials}</span>}
      {showImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={user?.username || "User"}
          src={user.profileImageUrl}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setImgErr(true)}
        />
      )}
    </div>
  );
}
