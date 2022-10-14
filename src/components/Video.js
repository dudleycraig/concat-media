import React, {setState, forwardRef} from 'react';

export default forwardRef(({setState, active, ...props}, ref) =>  
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
      status:'loaded-next-clip', 
      sequence:{
        ...state.sequence, 
        clips:[
          ...(state.sequence.index > 0 ? state.sequence.clips.slice(0, state.sequence.index) : []), 
          {...state.sequence.clips[state.sequence.index], duration:event.target.duration * 1000}, 
          ...state.sequence.clips.slice(state.sequence.index + 1)
        ]
      }
    }))}
    onRateChange={event => null}
    onSuspend={event => null}
    onEnded={event => setState(state => ({...state, status:'ended-clips'}))}
    // onTimeUpdate={event => setState(state => (state.status !== 'load-next-clip' && event.target.duration - event.target.currentTime < 0.3 && {...state, status:'next'}))}
    onError={error => setState(state => ({status:'error', messages:[{error:error.message}]}))}
  />
);
