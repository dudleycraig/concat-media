import React, {useEffect, useRef, forwardRef} from 'react';
import {MeshBasicMaterial, VideoTexture, Mesh, OrthographicCamera, PlaneGeometry, Scene, WebGLRenderer} from 'three';

const Renderer = forwardRef(({width, height, video}, ref) => {

  useEffect(() => {
    if (ref.current) {
      const scale = window.devicePixelRatio;
      ref.current.width = Math.floor(width * scale);
      ref.current.height = Math.floor(height * scale);

      const scene = new Scene();
      const camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1);
      const geometry = new PlaneGeometry(2, 2);

      const texture = new VideoTexture(video.current);
      const material = new MeshBasicMaterial();
      material.map = texture;

      const plane = new Mesh(geometry, material);
      scene.add(plane);

      const context = new WebGLRenderer({canvas:ref.current, alpha:true});
      context.autoClearColor = true;
      context.setClearColor(0x000000, 0);
      context.setPixelRatio(devicePixelRatio);

      // TODO: move to animation loop
      context.render(scene, camera);
    }
  }, [width, height, video]);

  return (<canvas ref={ref} className={'canvas'} />);
});

export default Renderer;
