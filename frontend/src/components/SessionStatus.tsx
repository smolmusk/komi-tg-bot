interface Props {
  status: "online" | "offline" | "connecting";
}

const SessionStatus = ({ status }: Props) => {
  const copy = {
    online: "Connected",
    offline: "Disconnected",
    connecting: "Reconnecting...",
  };

  return <div className={`status status-${status}`}>{copy[status]}</div>;
};

export default SessionStatus;
