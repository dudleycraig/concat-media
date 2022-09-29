import React, {useEffect, useRef, useState, forwardRef} from 'react';
import {MeshBasicMaterial, VideoTexture, Mesh, OrthographicCamera, PlaneGeometry, Scene, WebGLRenderer} from 'three';
import './index.css';

const Messages = ({messages, render = false, ...props}) => {
  const map = {error: console.error, warning: console.warn, success: console.info};
  return render 
    ? <ul className="messages">{messages.map((message, index) => <li className={Object.keys(message)[0]} key={`message-${index}`}>{message[Object.keys(message)[0]]}</li>)}</ul>
    : messages.map(message => map[Object.keys(message)[0]](message[Object.keys(message)[0]]));
};

const nextIndexForTransition = (transition, currentIndex) => ({next: currentIndex + 1, current: currentIndex, prev: currentIndex - 1}[transition]);

const Video = forwardRef(({state, setState, ...props}, ref) =>  
  <video 
    className="video" style={{display: 'none'}} ref={ref}
    muted={true} autoPlay={false} playsInline={true} loop={false} preload={'metadata'}
    onWaiting={event => null}
    onPlay={event => null}
    onPlaying={event => null}
    onPause={event => null}
    onDurationChange={event => null}
    onEmptied={event => null}
    onLoadedData={event => null}
    onLoadedMetadata={event => null}
    onRateChange={event => null}
    onSuspend={event => null}
    onEnded={event => () => setState({...state, status: 'error'})} 
    onTimeUpdate={event => state.status !== 'next' && event.target.duration - event.target.currentTime < 0.3 && setState({...state, status: 'next'})}
    onError={(error) => setState({...state, status: 'error', messages: [{error: error.message}]})}
  />
);

const App = (props) => {
  const mediaRef = useRef();
  const canvasRef = useRef();
  const flopVideoRef = useRef();
  const flipVideoRef = useRef();
  const [state, setState] = useState({
    status: 'inert',
    active: 'flip',
    renderer: {
      dimensions: undefined,
      context: undefined,
      interval: 1000 / 60,
      intervalId: undefined
    },
    sequence: {
      index: 0,
      clips: [
        {transition: 'next', file: 'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing0_1920x1080.mp4'},
        {transition: 'current', file: 'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing1_1920x1080.mp4'},
        {transition: 'next', file: 'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing2_1920x1080.mp4'}
      ]
    },
    messages: []
  });

  useEffect(() => {
    if (flipVideoRef.current) {
      switch (state.status) {

        case ('init'):
          const {width, height} = mediaRef.current.getBoundingClientRect();
          canvasRef.current.style.width = `${width}px`;
          canvasRef.current.style.height = `${height}px`;

          const scale = window.devicePixelRatio;
          canvasRef.current.width = Math.floor(width * scale);
          canvasRef.current.height = Math.floor(height * scale);

          const context = canvasRef.current.getContext('2d', {alpha: false});
          context.scale(scale, scale);
          context.fillStyle = '#000000';

          setState({...state, status: 'loading', renderer: {...state.renderer, context, dimensions: [0, 0, width, height]}});
          break;

        case ('loading'):
          Promise.all(
            state.sequence.clips
              .map(clip => fetch(clip.file)
                .then(response => response.blob().then(blob => URL.createObjectURL(blob)))))
            .then(blobs => setState({...state, status: 'loaded', sequence: {...state.sequence, clips: blobs.reduce((clips, blob, index) => [...clips, {...state.sequence.clips[index], blob}], [])}}))
            .catch(error => setState({...state, status: 'error', messages: [{error: error.message}]}));
          break;

        case ('loaded'):
          flipVideoRef.current.src = state.sequence.clips[state.sequence.index].blob;
          setState({...state, status: 'transition'});
          break;

        case ('next'):
          setState({...state, status: 'transition', active: state.active === 'flop' ? 'flip' : 'flop', sequence: {...state.sequence, index: nextIndexForTransition(state.sequence.clips[state.sequence.index].transition, state.sequence.index)}});
          break;

        case ('transition'):
          if (state.renderer.intervalId) clearInterval(state.renderer.intervalId);
          setState({...state, status: 'play', renderer: {...state.renderer, intervalId: setInterval(() => state.renderer.context.drawImage((state.active === 'flip' ? flipVideoRef : flopVideoRef).current, ...state.renderer.dimensions), state.renderer.interval)}});
          break;

        case ('play'):
          (state.active === 'flip' ? flipVideoRef : flopVideoRef).current.play();
          setState({...state, status: 'playing'});
          break;

        case ('playing'):
          (state.active === 'flip' ? flopVideoRef : flipVideoRef).current.src = state.sequence.clips[nextIndexForTransition(state.sequence.clips[state.sequence.index].transition, state.sequence.index)].blob;
          break;
      }
    }
  }, [state.status]);

  useEffect(() => setState({...state, status: 'init'}), []);

  return (
    <div className="layout">
      <div className="content">
        <div ref={mediaRef} className="media">
          <canvas ref={canvasRef} className={'canvas'} />
          <Video ref={flipVideoRef} state={state} setState={setState} />
          <Video ref={flopVideoRef} state={state} setState={setState} />
        </div>
        <Messages messages={state.messages} render={false} />
      </div>
    </div>
  );
}

export default App;

/**
  canvasRef.current.style.width = `${width}px`;
  canvasRef.current.style.height = `${height}px`;

  const scale = window.devicePixelRatio;
  canvasRef.current.width = Math.floor(width * scale);
  canvasRef.current.height = Math.floor(height * scale);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1);
  const texture = new VideoTexture(flipVideoRef.current);
  const geometry = new PlaneGeometry(2, 2);
  const material = new MeshBasicMaterial();
  material.map = texture;

  const plane = new Mesh(geometry, material);
  scene.add(plane);

  const context = new WebGLRenderer({canvas: canvasRef.current, alpha: true});
  context.autoClearColor = true;
  context.setClearColor(0x000000, 0);
  context.setPixelRatio(devicePixelRatio);
  context.render(scene, camera);

  setState({...state, status: 'loading', context, messages: [{success: 'media loading'}]});
 **/

/**
  const useAnimationFrame = (handler) => {
    const frame = useRef(0);

    useEffect(() => {
      const animate = () => {
        handler();
        frame.current = requestAnimationFrame(animate);
      }

      frame.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame.current);
    }, [handler]);
  };
 **/

