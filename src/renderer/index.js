import {MeshBasicMaterial, VideoTexture, Mesh, OrthographicCamera, PlaneGeometry, Scene, WebGLRenderer} from 'three';

const renderer = {
  init: (mediaRef, canvasRef, videoRef) => {
    const {width, height} = mediaRef.current.getBoundingClientRect();
    canvasRef.current.style.width = `${width}px`;
    canvasRef.current.style.height = `${height}px`;

    const scale = window.devicePixelRatio;
    canvasRef.current.width = Math.floor(width * scale);
    canvasRef.current.height = Math.floor(height * scale);

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, -1, 1);
    const geometry = new PlaneGeometry(2, 2);

    const texture = new VideoTexture(videoRef.current);
    const material = new MeshBasicMaterial();
    material.map = texture;

    const plane = new Mesh(geometry, material);
    scene.add(plane);

    const context = new WebGLRenderer({canvas:canvasRef.current, alpha:true});
    context.autoClearColor = true;
    context.setClearColor(0x000000, 0);
    context.setPixelRatio(devicePixelRatio);

    return {context, dimensions:[0, 0, width, height], scene, camera};
  },
  draw: ({context, scene, camera}) => context.render(scene, camera)
}

export default renderer;
