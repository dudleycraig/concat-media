import React, {useEffect, useRef, forwardRef, useState} from 'react';
import './index.css';

const Messages = ({messages, ...props}) => (
  <ul className="messages">
    {messages.map((message, index) => 
      <li className={Object.keys(message)[0]} key={`message-${index}`}>
        {message[Object.keys(message)[0]]}
      </li>
    )}
  </ul>
);

const App = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const mediaRef = useRef();

  const [state, setState] = useState({
    context: undefined,
    status: 'inert',
    messages: [],
    canvas: {
      disabled: false,
      interval: 1000 / 60,
      intervalId: undefined,
      dimensions: [], 
      context: undefined
    },
    sequence: {
      index: 0,
      clips: [
        {instruction: 'next', url: 'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing0_1920x1080.mp4'},
        {instruction: 'loop', url: 'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing1_1920x1080.mp4'},
        {instruction: 'next', url: 'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing2_1920x1080.mp4'}
      ]
    },
  });

  useEffect(() => {
    if (!state.canvas.disabled) {
      const {x, y, width, height, ...location} = mediaRef.current.getBoundingClientRect();
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;

      const scale = window.devicePixelRatio;
      canvasRef.current.width = Math.floor(width * scale);
      canvasRef.current.height = Math.floor(height * scale);

      const context = canvasRef.current.getContext('2d', {alpha: false});
      context.scale(scale, scale);
      context.fillStyle = '#000000';

      setState({
        ...state, 
        status: 'loading', 
        messages: [{success: 'media loading'}, ...state.messages],
        canvas: {
          ...state.canvas, 
          dimensions: [0, 0, width, height],
          context
        }
      });
    }
    else {
      setState({
        ...state, 
        status: 'loading', 
        messages: [{success: 'media loading'}, ...state.messages]
      });
    }
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      switch (state.status) {

        case ('loading'):
          Promise.all(
            state.sequence.clips
              .map(entry => fetch(entry.url)
                .then(response => response.blob().then(blob => URL.createObjectURL(blob)))))
            .then(blobs => setState({...state, status: 'loaded', messages: [{success: 'media loaded'}, ...state.messages], sequence: {...state.sequence, clips: blobs.reduce((clips, blob, index) => [...clips, {...state.sequence.clips[index], blob}], [])}}))
            .catch(error => setState({...state, status: 'error', messages: [{error: error.message}, ...state.messages]}));
          break;

        case ('loaded'):
          setState({...state, status: 'playing', messages: [{success: `media playing clip ${state.sequence.index}`}, ...state.messages]});
          break;

        case ('playing'):
          videoRef.current.src = state.sequence.clips[state.sequence.index].blob;
          videoRef.current.play();
          if (!state.canvas.disabled) {
            setState({
              ...state, 
              canvas: {
                ...state.canvas, 
                intervalId: window.setInterval(
                  () => state.canvas.context.drawImage(videoRef.current, ...state.canvas.dimensions),
                  state.canvas.interval
                )
              }
            });
          }
          break;

        // paused

        case ('ended'):
          if (!state.canvas.disabled) clearInterval(state.canvas.intervalId);
          switch (state.sequence.clips[state.sequence.index].instruction) {

            case ('next'): 
              setState({...state, status: 'playing', messages: [{success: `media playing next clip ${state.sequence.index}`}, ...state.messages], sequence: {...state.sequence, index: ++state.sequence.index}});
              break;

            case ('prev'): 
              setState({...state, status: 'playing', messages: [{success: `media playing prev clip ${state.sequence.index}`}, ...state.messages], sequence: {...state.sequence, index: --state.sequence.index}});
              break;

            case ('loop'):
              setState({...state, status: 'playing', messages: [{success: `media playing loop clip ${state.sequence.index}`}, ...state.messages]});
              break;
          }
          break;

        default:
          break;
      }
    }
  }, [state.status]);

  return (
    <div className="layout">
      <div className="content">
        <div ref={mediaRef} className="media">
          <canvas
            className="canvas"
            style={{display: (state.canvas.disabled ? 'none' : 'block')}}
            ref={canvasRef}
          />
          <video
            className="video"
            style={{display: (state.canvas.disabled ? 'block' : 'none')}}
            ref={videoRef} 
            muted={true} 
            autoPlay={true} 
            playsInline={true} 
            loop={false} 
            crossOrigin={'anonymous'} 
            preload={'auto'}
            onPlay={() => setState({...state, status: 'playing'})}
            onPause={() => setState({...state, status: 'paused'})}
            onEnded={() => setState({...state, status: 'ended', messages: [{success: `media ended clip ${state.sequence.index}`}, ...state.messages]})}
            onError={(error) => setState({...state, status: 'error', messages: [{error: error.message}, ...state.messages]})}
          />
        </div>
        <Messages messages={state.messages} />
      </div>
    </div>
  );
}

export default App;
