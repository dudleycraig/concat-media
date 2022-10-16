import React, {useEffect, useRef, useState} from 'react';
import useAnimationFrame from '../hooks/useAnimationFrame';
import Messages from './Messages';
import Video from './Video';
import Renderer from './Renderer';

const Sequencer = ({children}) => {
  const DEBUG = true;
  const [dimensions, setDimensions] = useState({width:undefined, height:undefined});
  const [state, setState] = useState({status:'inert', sequence:{active:0, transitions:children.reduce((transitions, {props}) => ([...transitions, props]), [])}, messages:[]});
  const mediaRef = useRef();
  const rendererRef = useRef();
  const videoRef = useRef();
  const reducer = (state, {time}) => {
    if (!mediaRef.current || !rendererRef.current || !videoRef.current) return state;
    if (DEBUG) console.log(state.status);
    switch (state.status) {
      case ('inert'): return state;
      case ('init'): return {...state, status:'requesting-transitions'};
      case ('requesting-transitions'):
        Promise.all(
          state.sequence.transitions
            .map(transition => fetch(transition.source)
              .then(response => response.blob().then(blob => URL.createObjectURL(blob)))))
          .then(blobs => setState(state => ({...state, status:'transitions-response-received', sequence:{...state.sequence, transitions:blobs.reduce((transitions, blob, index) => [...transitions, {...state.sequence.transitions[index], blob}], [])}})))
          .catch(error => setState(state => ({...state, status:'error', messages:[{error:error.message}]})));
        return {...state, status:'waiting-transitions-response'};
      case ('waiting-transitions-response'): 
        return state;
      case ('transitions-response-received'): return {...state, status:'load-next-transition'};
      case ('transition-next-transition'): return {...state, status:'load-next-transition', sequence:{...state.sequence, active:{next:state.sequence.active + 1, current:state.sequence.active, prev:state.sequence.active - 1}[state.sequence.transitions[state.sequence.active].transition], transitions:[...(state.sequence.active > 0 ? state.sequence.transitions.slice(0, state.sequence.active) : []), {...state.sequence.transitions[state.sequence.active], started:0}, ...(state.sequence.transitions.length > (state.sequence.active + 1) ? state.sequence.transitions.slice(state.sequence.active + 1) : [])]}};
      case ('load-next-transition'): 
        videoRef.current.src = state.sequence.transitions[state.sequence.active].blob;
        return {...state, status:'loading-next-transition'};
      case ('loading-next-transition'): return state;
      case ('loaded-next-transition'): return {...state, status:'play-transition'};
      case ('play-transition'):
        videoRef.current.play();
        return {...state, status:'playing-transition', sequence:{...state.sequence, transitions:[...(state.sequence.active > 0 ? state.sequence.transitions.slice(0, state.sequence.active) : []), {...state.sequence.transitions[state.sequence.active], started:Date.now()}, ...(state.sequence.transitions.length > (state.sequence.active + 1) ? state.sequence.transitions.slice(state.sequence.active + 1) : [])]}};
      case ('playing-transition'): return {...state, status:state.sequence.transitions[state.sequence.active].duration - (Date.now() - state.sequence.transitions[state.sequence.active].started) < 5 ? 'transition-next-transition' : 'playing-transition'};
      case ('ended-transitions'):
      case ('error'): return {...state, status:'stop'};
      case ('stop'): return state;
      default: return {...state, status:'error', messages:[{error:`No defined handler for status '${state.status}'`}]};
    }
  }

  useEffect(() => {
    const {width, height} = mediaRef.current.getBoundingClientRect();
    setDimensions({width:`${width}px`, height:`${height}px`});
    setState(state => ({...state, status:'init'}));
  }, []);

  useAnimationFrame(time => {
    setState(state => reducer(state, time));
  });

  return (
    <div className="layout">
      <div className="content">
        <div ref={mediaRef} className="media">
          <Video ref={videoRef} setState={setState} active={false} />
          <Renderer ref={rendererRef} width={dimensions.width} height={dimensions.height} video={videoRef} />
        </div>
        <Messages messages={state.messages} render={false} />
      </div>
    </div>
  );
}

export default Sequencer;
