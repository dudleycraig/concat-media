import React from 'react';
import './index.css';
import Sequencer from './components/Sequencer';
import Transition from './components/Transition';

const App = props => {
  const SOURCE = 'remote';
  const sources = {
    local:['./assets/mp4/unboxing0_1920x1080.mp4', './assets/mp4/unboxing1_1920x1080.mp4', './assets/mp4/unboxing2_1920x1080.mp4'],
    remote:['https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing0_1920x1080.mp4', 'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing1_1920x1080.mp4', 'https://cdn.cryptoys.dev/public/unboxing/zoofo/unboxing2_1920x1080.mp4']
  }

  return (
    <Sequencer>
      <Transition uuid={'init'} type={'next'} source={sources[SOURCE][0]} />
      <Transition uuid={'loop'} type={'current'} source={sources[SOURCE][1]}>
        <button type="button" onClick={() => console.log('click handler')}>waiting ...</button>
      </Transition>
      <Transition uuid={'end'} type={'next'} source={sources[SOURCE][2]} />
    </Sequencer>
  );
}

export default App;
