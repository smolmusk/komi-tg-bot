import type { LeaderboardEntry } from "../types";

interface Props {
  entries: LeaderboardEntry[];
}

const Leaderboard = ({ entries }: Props) => {
  return (
    <div className="card">
      <h2>Top Players</h2>
      <ul>
        {entries.map((entry) => (
          <li key={entry.userId}>
            <span>#{entry.rank}</span>
            <span>{entry.username ?? "Anonymous"}</span>
            <span>{entry.totalClicks}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
