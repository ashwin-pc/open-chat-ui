import { useState } from 'react';

export function useImmersiveMode() {
  const [isImmersive, setIsImmersive] = useState(false);
  const toggleImmersive = () => setIsImmersive((prev) => !prev);

  return { isImmersive, toggleImmersive };
}
