interface Props {
  totalClicks: string;
}

const GlobalStats = ({ totalClicks }: Props) => {
  return (
    <div className="card">
      <h2>Global Clicks</h2>
      <p>{totalClicks}</p>
    </div>
  );
};

export default GlobalStats;
