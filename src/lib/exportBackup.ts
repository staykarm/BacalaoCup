import writeXlsxFile, { getSheetData, Column } from "write-excel-file/browser";
import { Day, Match, MatchHole, Player, PlayerYearStat, RESULT_LABELS, Session } from "./types";

interface BackupData {
  players: Player[];
  days: Day[];
  sessions: Session[];
  matches: Match[];
  matchHoles: MatchHole[];
  playerYearStats: PlayerYearStat[];
}

function s(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

/** Downloads a single .xlsx file with every piece of match data, for manual backup. */
export async function exportBackupToExcel(data: BackupData) {
  const { players, days, sessions, matches, matchHoles, playerYearStats } = data;
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const dayById = new Map(days.map((day) => [day.id, day]));
  const playerById = new Map(players.map((player) => [player.id, player]));

  const dayLabel = (sessionId: string) => {
    const session = sessionById.get(sessionId);
    return session ? dayById.get(session.day_id)?.label ?? "" : "";
  };
  const sessionName = (sessionId: string) => sessionById.get(sessionId)?.name ?? "";
  const playerName = (id: string | null) => (id ? playerById.get(id)?.name ?? id : "");

  const matchPlayRows = matches.filter((m) => m.flight_team === null);
  const scrambleRows = matches.filter((m) => m.flight_team !== null);

  const matchColumns: Column<Match>[] = [
    { header: "Dag", cell: (m) => dayLabel(m.session_id) },
    { header: "Økt", cell: (m) => sessionName(m.session_id) },
    { header: "Start", cell: (m) => s(m.start_time) },
    { header: "Poeng", cell: (m) => s(m.points) },
    { header: "Gray 1", cell: (m) => playerName(m.gray_player1) },
    { header: "Gray 2", cell: (m) => playerName(m.gray_player2) },
    { header: "Aqua 1", cell: (m) => playerName(m.aqua_player1) },
    { header: "Aqua 2", cell: (m) => playerName(m.aqua_player2) },
    { header: "Resultat", cell: (m) => RESULT_LABELS[m.result] },
    { header: "Poeng Gray", cell: (m) => s(m.points_gray) },
    { header: "Poeng Aqua", cell: (m) => s(m.points_aqua) },
    { header: "Live Up", cell: (m) => s(m.live_up) },
    { header: "Live Thru", cell: (m) => s(m.live_thru) },
    { header: "Notat", cell: (m) => s(m.note) },
    { header: "ID", cell: (m) => m.id },
  ];

  const scrambleColumns: Column<Match>[] = [
    { header: "Dag", cell: (m) => dayLabel(m.session_id) },
    { header: "Økt", cell: (m) => sessionName(m.session_id) },
    { header: "Lag", cell: (m) => s(m.flight_team) },
    { header: "Start", cell: (m) => s(m.start_time) },
    { header: "Score vs par", cell: (m) => s(m.score_vs_par) },
    { header: "Hull spilt", cell: (m) => s(m.live_thru) },
    { header: "ID", cell: (m) => m.id },
  ];

  const holeColumns: Column<MatchHole>[] = [
    { header: "Match ID", cell: (h) => h.match_id },
    { header: "Hull", cell: (h) => s(h.hole_number) },
    { header: "Resultat", cell: (h) => s(h.result) },
    { header: "Score vs par", cell: (h) => s(h.score_vs_par) },
  ];

  const playerColumns: Column<Player>[] = [
    { header: "Navn", cell: (p) => p.name },
    { header: "Lag", cell: (p) => p.team_id },
    { header: "HCP", cell: (p) => s(p.hcp) },
    { header: "ID", cell: (p) => p.id },
  ];

  const historyColumns: Column<PlayerYearStat>[] = [
    { header: "Spiller", cell: (h) => playerName(h.player_id) },
    { header: "År", cell: (h) => s(h.year) },
    { header: "Rekord", cell: (h) => s(h.record) },
    { header: "Individuelle poeng", cell: (h) => s(h.individual_points) },
    { header: "Totalpoeng", cell: (h) => s(h.total_points) },
  ];

  const today = new Date().toISOString().slice(0, 10);

  await writeXlsxFile(
    [
      { sheet: "Kamper", data: getSheetData(matchPlayRows, matchColumns) },
      { sheet: "Scramble", data: getSheetData(scrambleRows, scrambleColumns) },
      { sheet: "Hull for hull", data: getSheetData(matchHoles, holeColumns) },
      { sheet: "Spillere", data: getSheetData(players, playerColumns) },
      { sheet: "Historikk", data: getSheetData(playerYearStats, historyColumns) },
    ],
    { fontFamily: "Calibri", fontSize: 11 }
  ).toFile(`bacalao-cup-backup-${today}.xlsx`);
}
