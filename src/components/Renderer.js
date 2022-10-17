import React, {useEffect, forwardRef} from 'react';
import {OrthographicCamera, Scene, WebGLRenderer} from 'three';
import {MeshBasicMaterial, VideoTexture, Mesh, PlaneGeometry} from 'three';

const Renderer = forwardRef(({dimensions, video, setContext}, ref) => {
  useEffect(() => {
    if (ref.current) {
      const renderer = new WebGLRenderer({canvas:ref.current, alpha:true});
      renderer.autoClearColor = true;
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(devicePixelRatio);

      const scale = window.devicePixelRatio; // generally 1
      // TODO: calculate aspect ratio and apply to canvas

      const scene = new Scene();
      const camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1);

      const texture = new VideoTexture(video.current);
      const material = new MeshBasicMaterial();
      material.map = texture;

      const geometry = new PlaneGeometry(2, 2);
      const plane = new Mesh(geometry, material);
      plane.name = 'video';
      scene.add(plane);

      setContext({renderer, scene, camera});
    }
  }, [video]);

  return (<canvas ref={ref} className={'renderer'} width={`${dimensions.width}px`} height={`${dimensions.height}px`} />);
});

export default Renderer;
