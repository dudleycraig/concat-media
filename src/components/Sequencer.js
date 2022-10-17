import React, {useEffect, useRef, useState} from 'react';
import useWindowDimensions from '../hooks/useWindowDimensions';
import useAnimationFrame from '../hooks/useAnimationFrame';
import Video from './Video';
import Renderer from './Renderer';

const Sequencer = ({children}) => {
  const [state, setState] = useState({status:'idle', sequence:{active:0, transitions:[]}, context:undefined, messages:[]});
  const DEBUG = true;
  const dimensions = useWindowDimensions();
  const mediaRef = useRef();
  const rendererRef = useRef();
  const videoRef = useRef();
  const reducer = (state, {time}) => { // TODO: useCallback optimization
    if (!mediaRef.current || !rendererRef.current || !videoRef.current) return state;
    if (DEBUG) console.log(state.status);

    switch (state.status) {
      // nothing should be happening, requires state changes outside of reducer to affect change
      case ('idle'): 
        return state;

      // initialize transitions, TODO: update transitions (add new transitions or overwrite current transtions)
      case ('init'): 
        return {
          ...state, 
          status:'requesting-transitions',
          sequence: {
            ...state.sequence,
            transitions:children.reduce((transitions, {props}) => ([...transitions, props]), []), // append props from child Transitions
          }
        };

      // fetch ALL current transitions
      case ('requesting-transitions'):
        Promise.all(
          state.sequence.transitions // TODO: filter on source so only unique sources are requested
            .map(transition => fetch(transition.source)
              .then(response => response.blob().then(blob => URL.createObjectURL(blob)))))
          .then(blobs => setState(state => ({
            ...state, 
            status:'transitions-response-received', 
            sequence:{
              ...state.sequence, 
              // append the blob as a property of each transition
              transitions:blobs.reduce((transitions, blob, active) => [...transitions, {...state.sequence.transitions[active], blob}], [])
            }
          })))
          .catch(error => setState(state => ({
            ...state, 
            status:'error', 
            messages:[{error:error.message}]
          })));
        return {
          ...state, 
          status:'waiting-transitions-response'
        };

      // loop over until promise from "requesting-transitions" is resolved
      case ('waiting-transitions-response'): 
        return state;

      // promise from "requesting-transitions" has been resolved, activate next status
      case ('transitions-response-received'): 
        return {
          ...state, 
          status:'load-next-transition'
        };

      // calculate next active transition, reset "started" timer on current transition
      case ('init-next-transition'): 
        return {
          ...state, 
          status:'load-next-transition', 
          sequence:{
            ...state.sequence, 
            active:{next:state.sequence.active + 1, current:state.sequence.active, prev:state.sequence.active - 1}[state.sequence.transitions[state.sequence.active].type], 
            transitions:[ // immutably update currently active transition (we could do state.sequence[state.sequence.active] = {...}, but don't want side effects during animation loop)
              ...(state.sequence.active > 0 ? state.sequence.transitions.slice(0, state.sequence.active) : []), 
              {...state.sequence.transitions[state.sequence.active], started:0}, 
              ...(state.sequence.transitions.length > (state.sequence.active + 1) ? state.sequence.transitions.slice(state.sequence.active + 1) : [])
            ]
          }
        };

      // overwrite video tags' source with next transitions' clip
      case ('load-next-transition'): 
        videoRef.current.src = state.sequence.transitions[state.sequence.active].blob;
        return {
          ...state, 
          status:'loading-next-transition'
        };

      // loop over until video tags' onLoadedMetadata event has been triggered and appended current transitions clip duration
      case ('loading-next-transition'): 
        return state;

      // video tags' onLoadedMetadata event has been triggered, go to next state
      case ('loaded-next-transition'): 
        return {
          ...state, 
          status:'play-transition'
        };

      // trigger video tags' play event handler, set transitions' "started" time property
      case ('play-transition'): 
        videoRef.current.play();
        return {
          ...state, 
          status:'playing-transition', 
          sequence:{
            ...state.sequence, 
            transitions:[ // immutably update currently active transition (we could do state.sequence[state.sequence.active] = {...}, but don't want side effects during animation loop)
              ...(state.sequence.active > 0 ? state.sequence.transitions.slice(0, state.sequence.active) : []), 
              {...state.sequence.transitions[state.sequence.active], started:Date.now()}, 
              ...(state.sequence.transitions.length > (state.sequence.active + 1) ? state.sequence.transitions.slice(state.sequence.active + 1) : [])
            ]
          }
        };

      // loop over currently active transition until it's 5ms before end, then trigger next transition
      case ('playing-transition'):
        return {
          ...state, 
          status:state.sequence.transitions[state.sequence.active].duration - (Date.now() - state.sequence.transitions[state.sequence.active].started) < 5 ? 'init-next-transition' : 'playing-transition'
        };

      // either video tags' onEnded event has been triggered, no more transitions to be executed, or an error occurred
      case ('ended-transitions'):
      case ('error'):
        return {
          ...state, 
          status:'stop'
        };

      // transitions have all stopped, cleanup/destroy/dispose cycle
      case ('stop'):
        return {
          ...state,
          status:'idle'
        };

      // something went wrong if this is triggered
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

  useEffect(() => {
    setState(state => ({...state, status:'init'}));
  }, []);

  useAnimationFrame(time => {
    if (state.context && state.context.renderer && state.context.renderer) {
      setState(state => reducer(state, time));
      state.context.renderer.render(state.context.scene, state.context.camera);
    }
  });

  return (
    <div ref={mediaRef} className="sequencer">
      <Video ref={videoRef} setState={setState} active={false} />
      <Renderer ref={rendererRef} dimensions={dimensions} video={videoRef} setContext={context => setState(state => ({...state, context}))} />
    </div>
  );
}

export default Sequencer;
