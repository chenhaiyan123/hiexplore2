
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypingEffectProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  components?: any; // Pass markdown components (CodeBlock, SmartListItem)
}

const TypingEffect: React.FC<TypingEffectProps> = ({ 
  text, 
  speed = 20, 
  onComplete, 
  className,
  components 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef<any>(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    // Reset state when text changes significantly or initially
    setDisplayedText('');
    indexRef.current = 0;
    hasCompletedRef.current = false;
    
    if (timerRef.current) clearInterval(timerRef.current);

    // If text is empty, complete immediately
    if (!text) {
        if (onComplete) onComplete();
        return;
    }

    timerRef.current = setInterval(() => {
      // Typing speed variation for natural feel (1-3 chars per tick)
      const step = Math.floor(Math.random() * 3) + 1; 
      const nextIndex = indexRef.current + step;
      
      if (nextIndex >= text.length) {
        setDisplayedText(text);
        if (timerRef.current) clearInterval(timerRef.current);
        if (!hasCompletedRef.current && onComplete) {
            hasCompletedRef.current = true;
            onComplete();
        }
      } else {
        setDisplayedText(text.slice(0, nextIndex));
        indexRef.current = nextIndex;
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed]);

  return (
    <div className={className}>
      <ReactMarkdown components={components}>{displayedText}</ReactMarkdown>
      {!hasCompletedRef.current && (
        <span className="inline-block w-1.5 h-3.5 bg-blue-400 ml-0.5 animate-pulse align-middle" />
      )}
    </div>
  );
};

export default TypingEffect;
