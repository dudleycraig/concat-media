import React, {useEffect, useRef, forwardRef, useState} from 'react';
import THREE, {Material, MeshBasicMaterial, VideoTexture, Mesh, OrthographicCamera, PlaneGeometry, Scene, Vector4, WebGLRenderer} from 'three';
import './index.css';

const useAnimationFrame = (handler, duration = Number.POSITIVE_INFINITY, active = true) => {
  const frame = useRef(0);
  const firstFrameTime = useRef(performance.now());

  const animate = (now) => {
    let timeFraction = (now - firstFrameTime.current) / duration;
    if (timeFraction > 1) timeFraction = 1;
    if (timeFraction <= 1) {
      handler();
      if (timeFraction != 1) frame.current = requestAnimationFrame(animate);
    }
  }

  useEffect(() => {
    if (active) {
      firstFrameTime.current = performance.now();
      frame.current = requestAnimationFrame(animate);
    }
    else {
      cancelAnimationFrame(frame.current);
    }
    return () => cancelAnimationFrame(frame.current);
  }, [active]);
}

const Messages = ({messages, ...props}) => (
  <ul className="messages">
    {messages.map((message, index) => 
      <li className={Object.keys(message)[0]} key={`message-${index}`}>
        {message[Object.keys(message)[0]]}
      </li>
    )}
  </ul>
);

const App = (props) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const mediaRef = useRef();

  const [state, setState] = useState({
    context: undefined,
    status: 'inert',
    mode: 'webgl', // use either native video element for rendering, canvas renderer, or webgl renderer. ['video', 'canvas', 'webgl']
    messages: [],
    canvas: {
      context: undefined,
      interval: 1000 / 60,
      intervalId: undefined,
      dimensions: []
    },
    sequence: {
      index: 0,
      clips: [
        {transition: 'next', file: 'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing0_1920x1080.mp4'},
        {transition: 'loop', file: 'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing1_1920x1080.mp4'},
        {transition: 'next', file: 'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing2_1920x1080.mp4'}
      ]
    },
  });

  const initCanvas = () => {
    const scale = window.devicePixelRatio;
    const context = canvasRef.current.getContext('2d', {alpha: true});
    context.scale(scale, scale);
    context.fillStyle = '#000000';
    return context;
  }

  const initWebGL = () => {
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1);
    const texture = new VideoTexture(videoRef.current);
    const geometry = new PlaneGeometry(2, 2);
    const material = new MeshBasicMaterial();
    material.map = texture;

    const plane = new Mesh(geometry, material);
    scene.add(plane);

    const context = new WebGLRenderer({canvas: canvasRef.current, alpha: true});
    context.autoClearColor = true;
    context.setClearColor(0x000000, 0);
    context.setPixelRatio(devicePixelRatio);

    useAnimationFrame({
      handler: () => context.render(scene, camera),
      active: true,
      duration: 1000
    });

    return context;
  }

  useEffect(() => setState({...state, status: 'init'}), []);

  useEffect(() => {
    if (videoRef.current) {
      switch (state.status) {

        case ('init'):
          const {x, y, width, height, ...location} = mediaRef.current.getBoundingClientRect();
          videoRef.current.style.width = `${width}px`;
          videoRef.current.style.height = `${height}px`;
          canvasRef.current.style.width = `${width}px`;
          canvasRef.current.style.height = `${height}px`;

          const scale = window.devicePixelRatio;
          canvasRef.current.width = Math.floor(width * scale);
          canvasRef.current.height = Math.floor(height * scale);

          setState({
            ...state, 
            status: 'loading', 
            messages: [{success: 'media loading'}, ...state.messages],
            canvas: {
              ...state.canvas, 
              dimensions: [0, 0, width, height], 
              context: state.mode === 'webgl' 
                ? initWebGL() 
                : (state.mode === 'canvas' 
                  ? initCanvas() 
                  : undefined)
            }
          });
          break;

        case ('loading'):
          Promise.all(
            state.sequence.clips
              .map(clip => fetch(clip.file)
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

          if (state.mode === 'canvas') {
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

        case ('ended'):
          if (state.mode === 'canvas') clearInterval(state.canvas.intervalId);
          switch (state.sequence.clips[state.sequence.index].transition) {

            case ('next'): 
              setState({
                ...state, 
                status: 'playing', 
                messages: [{success: `media playing next clip ${state.sequence.index}`}, ...state.messages], 
                sequence: {...state.sequence, index: ++state.sequence.index}
              });
              break;

            case ('prev'): 
              setState({
                ...state, 
                status: 'playing', 
                messages: [{success: `media playing prev clip ${state.sequence.index}`}, ...state.messages], 
                sequence: {...state.sequence, index: --state.sequence.index}
              });
              break;

            case ('loop'):
              setState({
                ...state, 
                status: 'playing', 
                messages: [{success: `media playing loop clip ${state.sequence.index}`}, ...state.messages]
              });
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
            style={{display: (state.mode !== 'video' ? 'block' : 'none')}}
            ref={canvasRef}
          />
          <video
            className="video"
            style={{display: (state.mode === 'video' ? 'block' : 'none')}}
            ref={videoRef} 
            muted={true} 
            autoPlay={false} 
            playsInline={true} 
            loop={false} 
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
