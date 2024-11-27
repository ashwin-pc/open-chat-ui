// Credit: https://codepen.io/aaroniker/pen/omvYNZ

export function ChatLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background w-full">
      <div className="loader triangle">
        <svg viewBox="0 0 86 80">
          <polygon points="43 8 79 72 7 72"></polygon>
        </svg>
      </div>
    </div>
  );
}
