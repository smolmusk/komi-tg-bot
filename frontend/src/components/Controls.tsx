interface Props {
  onClick: () => Promise<void>;
  disabled: boolean;
}

const Controls = ({ onClick, disabled }: Props) => {
  return (
    <div className="controls">
      <button
        type="button"
        onClick={() => {
          void onClick();
        }}
        disabled={disabled}
      >
        Tap
      </button>
    </div>
  );
};

export default Controls;
