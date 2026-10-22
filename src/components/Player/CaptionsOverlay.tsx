interface CaptionsOverlayProps {
  text: string;
}

export function CaptionsOverlay({ text }: CaptionsOverlayProps) {
  if (!text) return null;

  return (
    <div
      className="player-captions-overlay"
      style={{
        position: 'absolute',
        bottom: '68px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '85%',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 50
      }}
    >
      <span
        className="caption-text-box"
        style={{
          background: 'rgba(8, 8, 8, 0.78)',
          color: '#ffffff',
          padding: '4px 10px',
          borderRadius: '4px',
          fontSize: '17px',
          lineHeight: '1.4',
          fontWeight: 500,
          whiteSpace: 'pre-wrap',
          boxDecorationBreak: 'clone',
          WebkitBoxDecorationBreak: 'clone',
          textShadow: '0 1px 2px #000'
        }}
      >
        {text}
      </span>
    </div>
  );
}
