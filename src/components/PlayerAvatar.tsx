"use client";

import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { TeamId } from "@/lib/types";

/**
 * A player's portrait photo, gated behind the admin "Vis spillerbilder" setting.
 * With `fallbackTeamId` set, renders the team logo instead when photos are off —
 * for spots that already show a team logo and should keep doing so unchanged.
 * Without it, renders nothing when photos are off — for spots with no existing icon.
 */
export function PlayerAvatar({
  playerId,
  fallbackTeamId,
  size = 28,
  className = "",
}: {
  playerId: string;
  fallbackTeamId?: TeamId;
  size?: number;
  className?: string;
}) {
  const { showPlayerPhotos } = useTournament();

  if (!showPlayerPhotos && !fallbackTeamId) return null;

  const src = showPlayerPhotos
    ? `/avatars/${playerId}.webp`
    : fallbackTeamId === "gray"
      ? "/logos/gray.png"
      : "/logos/aquarellos.png";

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
