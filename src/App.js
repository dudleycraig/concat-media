import React, {useEffect, useRef, useState} from 'react';
import './index.css';
import useAnimationFrame from './hooks/useAnimationFrame';
import Messages from './components/Messages';
import Video from './components/Video';
import renderer from './renderer';

const App = props => {
  const [state, setState] = useState({
    status:'inert',
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
  const videoRef = useRef();

  const reducer = (state, {time}) => {
    if (!mediaRef.current || !canvasRef.current || !videoRef.current) return state;

    console.log(`status: ${state.status}`);
    switch (state.status) {
      case ('inert'): 
        return state;

      case ('init'): 
        return {
          ...state, 
          status:'requesting-clips', 
          renderer: {
            ...state.renderer,
            ...renderer.init(mediaRef, canvasRef, videoRef)
          }
        };

      case ('requesting-clips'):
        Promise.all(
          state.sequence.clips
            .map(clip => fetch(clip.file)
              .then(response => response.blob().then(blob => URL.createObjectURL(blob)))))
          .then(blobs => setState(state => ({...state, status:'clips-response-received', sequence:{...state.sequence, clips:blobs.reduce((clips, blob, index) => [...clips, {...state.sequence.clips[index], blob}], [])}})))
          .catch(error => setState(state => ({...state, status:'error', messages:[{error:error.message}]})));
        return {
          ...state, 
          status:'waiting-clips-response'
        };

      case ('waiting-clips-response'): 
        return state;

      case ('clips-response-received'): 
        return {
          ...state, 
          status:'load-next-clip'
        };

      case ('transition-next-clip'): 
        return {
          ...state, 
          status:'load-next-clip', 
          sequence:{
            ...state.sequence, 
            index:{next:state.sequence.index + 1, current:state.sequence.index, prev:state.sequence.index - 1}[state.sequence.clips[state.sequence.index].transition], 
            clips:[
              ...(state.sequence.index > 0 ? state.sequence.clips.slice(0, state.sequence.index) : []), 
              {...state.sequence.clips[state.sequence.index], started:0}, 
              ...(state.sequence.clips.length > (state.sequence.index + 1) ? state.sequence.clips.slice(state.sequence.index + 1) : [])
            ]
          }
        };

      case ('load-next-clip'): 
        videoRef.current.src = state.sequence.clips[state.sequence.index].blob;
        return {
          ...state, 
          status:'loading-next-clip'
        };

      case ('loading-next-clip'): 
        return state;

      case ('loaded-next-clip'): 
        return {
          ...state, 
          status:'play-clip'
        };

      case ('play-clip'):
        videoRef.current.play();
        return {
          ...state, 
          status:'playing-clip', 
          sequence:{
            ...state.sequence, 
            clips:[
              ...(state.sequence.index > 0 ? state.sequence.clips.slice(0, state.sequence.index) : []), 
              {...state.sequence.clips[state.sequence.index], started:Date.now()}, 
              ...(state.sequence.clips.length > (state.sequence.index + 1) ? state.sequence.clips.slice(state.sequence.index + 1) : [])
            ]
          }
        };

      case ('playing-clip'): 
        return {
          ...state, 
          status:state.sequence.clips[state.sequence.index].duration - (Date.now() - state.sequence.clips[state.sequence.index].started) < 20 ? 'transition-next-clip' : 'playing-clip'
        };

      case ('ended-clips'):
      case ('error'): 
        return {
          ...state, 
          status:'stop'
        };

      case ('stop'): 
        return state;

      default: 
        return {
          ...state, 
          status:'error', 
          messages:[
            {error:`No defined handler for status '${state.status}'`}
          ]
        };
    }
  }

  useAnimationFrame(time => {
    setState(state => reducer(state, time));
    if (state.renderer.context) renderer.draw(state.renderer); 
  });

  useEffect(() => {
    setState(state => ({...state, status:'init'}));
  }, []);

  return (
    <div className="layout">
      <div className="content">
        <div ref={mediaRef} className="media">
          <canvas ref={canvasRef} className={'canvas'} />
          <Video ref={videoRef} setState={setState} active={false} />
        </div>
        <Messages messages={state.messages} render={false} />
      </div>
    </div>
  );
}

export default App;

