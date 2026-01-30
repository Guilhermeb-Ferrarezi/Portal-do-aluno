import React from "react";
import "./ExerciseComponents.css";

type MouseEvent = {
  type: "click" | "double-click" | "right-click" | "move";
  x: number;
  y: number;
  timestamp: number;
};

type MouseInteractiveBoxProps = {
  title: string;
  instruction: string;
  onInteraction?: (events: MouseEvent[]) => void;
};

export default function MouseInteractiveBox({
  title,
  instruction,
  onInteraction,
}: MouseInteractiveBoxProps) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [events, setEvents] = React.useState<MouseEvent[]>([]);
  const [cursor, setCursor] = React.useState({ x: 0, y: 0 });
  const clickTimeoutRef = React.useRef<any>(undefined);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boxRef.current) return;

    const rect = boxRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCursor({ x, y });
  };

  const handleMouseLeave = () => {
    setCursor({ x: -100, y: -100 });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!boxRef.current) return;

    const rect = boxRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Detectar clique duplo
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      const newEvent: MouseEvent = {
        type: "double-click",
        x,
        y,
        timestamp: Date.now(),
      };
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      onInteraction?.(updatedEvents);
      clickTimeoutRef.current = undefined;
    } else {
      const newEvent: MouseEvent = {
        type: "click",
        x,
        y,
        timestamp: Date.now(),
      };
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      onInteraction?.(updatedEvents);

      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = undefined;
      }, 300);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!boxRef.current) return;

    const rect = boxRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newEvent: MouseEvent = {
      type: "right-click",
      x,
      y,
      timestamp: Date.now(),
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    onInteraction?.(updatedEvents);
  };

  const resetEvents = () => {
    setEvents([]);
  };

  return (
    <div className="mouseBoxContainer">
      <div className="mouseBoxHeader">
        <h4 className="mouseBoxTitle">{title}</h4>
        <button
          className="mouseBoxReset"
          onClick={resetEvents}
          type="button"
          title="Limpar eventos"
        >
          ↺ Limpar
        </button>
      </div>

      <p className="mouseBoxInstruction">{instruction}</p>

      <div
        ref={boxRef}
        className="mouseInteractiveBox"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Indicador do cursor */}
        {cursor.x >= 0 && cursor.y >= 0 && (
          <div
            className="mouseCursor"
            style={{
              left: `${cursor.x}px`,
              top: `${cursor.y}px`,
            }}
          >
            <div className="mouseCursorArrow">👆</div>
          </div>
        )}

        {/* Mostra eventos de clique */}
        {events.map((event, index) => (
          <div
            key={index}
            className={`mouseEvent mouseEvent-${event.type}`}
            style={{
              left: `${event.x}px`,
              top: `${event.y}px`,
            }}
            title={`${event.type} em ${new Date(event.timestamp).toLocaleTimeString()}`}
          >
            <span className="mouseEventLabel">
              {event.type === "click" && "🖱️"}
              {event.type === "double-click" && "🖱️🖱️"}
              {event.type === "right-click" && "🖱️→"}
            </span>
          </div>
        ))}

        <div className="mouseBoxContent">
          <p className="mouseBoxHint">👈 Clique, duplo-clique ou clique direito aqui</p>
        </div>
      </div>

      {/* Histórico de eventos */}
      {events.length > 0 && (
        <div className="mouseEventHistory">
          <h5>Histórico de Cliques ({events.length})</h5>
          <div className="eventsList">
            {events.map((event, index) => (
              <div key={index} className="eventItem">
                <span className="eventIndex">#{index + 1}</span>
                <span className="eventType">{event.type}</span>
                <span className="eventCoords">
                  ({event.x.toFixed(0)}, {event.y.toFixed(0)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
