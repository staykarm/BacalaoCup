"use client";

import Image from "next/image";
import { useTournament } from "@/context/TournamentContext";
import { TeamId } from "@/lib/types";

/**
 * A player's portrait photo. Everywhere except the main page's match list, photos
 * are always shown (`alwaysOn`) — the admin "Vis spillerbilder" setting only
 * controls that one spot. With `fallbackTeamId` set, renders the team logo instead
 * when photos are off there — for spots that already show a team logo and should
 * keep doing so unchanged. Without it, renders nothing when photos are off.
 */
export function PlayerAvatar({
  playerId,
  fallbackTeamId,
  size = 28,
  className = "",
  alwaysOn = false,
}: {
  playerId: string;
  fallbackTeamId?: TeamId;
  size?: number;
  className?: string;
  alwaysOn?: boolean;
}) {
  const { showPlayerPhotos } = useTournament();
  const photosOn = alwaysOn || showPlayerPhotos;

  if (!photosOn && !fallbackTeamId) return null;

  const src = photosOn
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
