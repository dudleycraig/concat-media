import {useEffect, useRef} from 'react';

const useAnimationFrame = callback => {
  const startedRef = useRef(Date.now());
  const currentRef = useRef(Date.now());
  const frameRef = useRef();
  const callbackRef = useRef();
  callbackRef.current = callback;

  const animate = now => {
    callbackRef.current({time:{started:startedRef.current, elapsed:now}});
    currentRef.current = now;
    frameRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);
};

export default useAnimationFrame;
