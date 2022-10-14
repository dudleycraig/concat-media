import React, {useEffect, useRef, useState, forwardRef} from 'react';
import {MeshBasicMaterial, VideoTexture, Mesh, OrthographicCamera, PlaneGeometry, Scene, WebGLRenderer} from 'three';
import './index.css';
import useAnimationFrame from './hooks/useAnimationFrame';
import Messages from './components/Messages';
import Video from './components/Video';

const init = (mediaRef, canvasRef, flipRef) => {
  const {width, height} = mediaRef.current.getBoundingClientRect();
  canvasRef.current.style.width = `${width}px`;
  canvasRef.current.style.height = `${height}px`;

  const scale = window.devicePixelRatio;
  canvasRef.current.width = Math.floor(width * scale);
  canvasRef.current.height = Math.floor(height * scale);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1);
  const texture = new VideoTexture(flipRef.current);
  const geometry = new PlaneGeometry(2, 2);
  const material = new MeshBasicMaterial();
  material.map = texture;

  const plane = new Mesh(geometry, material);
  scene.add(plane);

  const context = new WebGLRenderer({canvas:canvasRef.current, alpha:true});
  context.autoClearColor = true;
  context.setClearColor(0x000000, 0);
  context.setPixelRatio(devicePixelRatio);

  return {context, dimensions:[0, 0, width, height], scene, camera};
}

const App = props => {
  const [state, setState] = useState({
    status:'inert',
    players:{active:'flip', flip:undefined, flop:undefined},
    renderer:{dimensions:undefined, context:undefined, scene:undefined, camera:undefined},
    sequence:{
      index:0, 
      clips:[
        {transition:'next', file:'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing0_1920x1080.mp4', started: 0, elapsed: 0, duration: 0}, 
        {transition:'current', file:'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing1_1920x1080.mp4', started: 0, elapsed: 0, duration: 0}, 
        {transition:'next', file:'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing2_1920x1080.mp4', started: 0, elapsed: 0, duration: 0}
      ]},
    messages:[]
  });
  const mediaRef = useRef();
  const canvasRef = useRef();
  const flipRef = useRef();
  const flopRef = useRef();
  const reducer = (state, { time }) => {
    if (!mediaRef.current || !canvasRef.current || !flipRef.current || !flopRef.current) return state;
    switch (state.status) {
      case ('inert'):
        return state;

      case ('init'):
        return {...state, status:'requesting-clips', players:{...state.players, active:'flip', flip:flipRef.current, flop:flopRef.current}};

      case ('requesting-clips'):
        Promise.all(
          state.sequence.clips
            .map(clip => fetch(clip.file)
              .then(response => response.blob().then(blob => URL.createObjectURL(blob)))))
          .then(blobs => setState(state => ({...state, status:'clips-response-received', sequence:{...state.sequence, clips:blobs.reduce((clips, blob, index) => [...clips, {...state.sequence.clips[index], blob}], [])}})))
          .catch(error => setState(state => ({...state, status:'error', messages:[{error:error.message}]})));
        return {...state, status:'waiting-clips-response'};

      case ('waiting-clips-response'):
        return state;

      case ('clips-response-received'):
        return {...state, status:'load-next-clip'};

      case ('transition-next-clip'):
        return {...state, status:'load-next-clip', players:{...state.players, active:'flip'}, sequence:{...state.sequence, index:{next:state.sequence.index + 1, current:state.sequence.index, prev:state.sequence.index - 1}[state.sequence.clips[state.sequence.index].transition], clips:[...(state.sequence.index > 0 ? state.sequence.clips.slice(0, state.sequence.index) : []), {...state.sequence.clips[state.sequence.index], started:0}, ...(state.sequence.clips.length > (state.sequence.index + 1) ? state.sequence.clips.slice(state.sequence.index + 1) : [])]}};

      case ('load-next-clip'):
        state.players[state.players.active].src = state.sequence.clips[state.sequence.index].blob;
        return {...state, status:'loading-next-clip'};

      case ('loading-next-clip'):
        return state;

      case ('loaded-next-clip'):
        return {...state, status:'play-clip'};

      case ('play-clip'):
        state.players[state.players.active].play();
        return {...state, status:'playing-clip', sequence:{...state.sequence, clips:[...(state.sequence.index > 0 ? state.sequence.clips.slice(0, state.sequence.index) : []), {...state.sequence.clips[state.sequence.index], started:Date.now()}, ...(state.sequence.clips.length > (state.sequence.index + 1) ? state.sequence.clips.slice(state.sequence.index + 1) : [])]}};

      case ('playing-clip'):
        return {...state, status:state.sequence.clips[state.sequence.index].duration - (Date.now() - state.sequence.clips[state.sequence.index].started) < 100 ? 'transition-next-clip' : 'playing-clip'};

      default:
        return {...state, status:'error', messages:[{error:`No defined handler for status '${state.status}'`}]};

      case ('ended-clips'):
      case ('error'):
        return {...state, status:'stop'};

      case ('stop'):
        return state;
    }
  }

  useAnimationFrame(time => {
    setState(state => reducer(state, time));
  });

  useEffect(() => {
    setState({...state, status:'init'});
  }, []);

  return (
    <div className="layout">
      <div className="content">
        <div ref={mediaRef} className="media">
          <canvas ref={canvasRef} className={'canvas'} style={{display: 'none'}} />
          <Video ref={flipRef} setState={setState} active={true} />
          <Video ref={flopRef} setState={setState} active={false} />
        </div>
        <Messages messages={state.messages} render={false} />
      </div>
    </div>
  );
}

export default App;

