import React, {forwardRef} from 'react';

const Video = forwardRef(({setState, active, ...props}, ref) =>  
  <video 
    className="video" style={{display: active ? 'block' : 'none'}} ref={ref}
    muted={true} autoPlay={false} playsInline={true} loop={false} preload={'metadata'}
    onWaiting={event => null}
    onPlay={event => null}
    onPlaying={event => null}
    onPause={event => null}
    onDurationChange={event => null}
    onEmptied={event => null}
    onLoadedData={event => null}
    onLoadedMetadata={event => setState(state => ({
      ...state, 
      status:'loaded-next-transition', 
      sequence:{
        ...state.sequence, 
        transitions:[ // immutably update currently active transition (we don't want side effects during animation loop)
          ...(state.sequence.active > 0 ? state.sequence.transitions.slice(0, state.sequence.active) : []), 
          {...state.sequence.transitions[state.sequence.active], duration:event.target.duration * 1000}, 
          ...state.sequence.transitions.slice(state.sequence.active + 1)
        ]
      }
    }))}
    onRateChange={event => null}
    onSuspend={event => null}
    onEnded={event => setState(state => ({...state, status:'ended-transitions'}))}
    // onTimeUpdate={event => setState(state => (state.status !== 'load-next-transition' && event.target.duration - event.target.currentTime < 0.3 && {...state, status:'next'}))}
    onError={error => setState(state => ({status:'error', messages:[{error:error.message}]}))}
  />
);

export default Video;
