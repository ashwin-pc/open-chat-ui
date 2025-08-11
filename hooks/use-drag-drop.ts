import { useState, useCallback } from 'react';

export function useDragDrop() {
  const [isDragging, setIsDragging] = useState(false);
  const [_, setDragCounter] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCount = prev + 1;
      if (newCount > 0) setIsDragging(true);
      return newCount;
    });
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        setIsDragging(false);
        return 0;
      }
      return newCount;
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, onDrop: (files: FileList) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      onDrop(e.dataTransfer.files);
    }
  }, []);

  return { isDragging, handleDragOver, handleDragEnter, handleDragLeave, handleDrop };
}
