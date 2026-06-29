import { wsBase } from "./api.js";

export function createChatSocket({ sessionId, onSession, onStream, onStreamEnd, onText, onError, onDone }) {
  const socket = new WebSocket(`${wsBase()}/ws/chat`);
  let currentSessionId = sessionId;

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ session_id: currentSessionId || undefined }));
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case "session":
        currentSessionId = data.session_id;
        onSession?.(data.session_id);
        break;
      case "assistant_stream":
        onStream?.(data.content);
        break;
      case "assistant_stream_end":
        onStreamEnd?.();
        break;
      case "assistant_text":
        onText?.(data.content);
        break;
      case "error":
        onError?.(data.content);
        break;
      case "done":
        onDone?.();
        break;
      default:
        if (data.content) onText?.(data.content);
    }
  });

  socket.addEventListener("error", () => onError?.("Connection error — is the backend running?"));

  return {
    get sessionId() {
      return currentSessionId;
    },
    send(content) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ content }));
      }
    },
    close() {
      socket.close();
    },
  };
}
