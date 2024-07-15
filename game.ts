import * as THREE from 'three';
import { HemisphereLight, MathUtils, MirroredRepeatWrapping, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, ShaderMaterial, TextureLoader, Vector3, WebGLRenderer } from "three";

import {Water} from './objects/water';
import {Sky} from "three/examples/jsm/objects/Sky";

export const scene = new Scene()
export const camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
)

// Our three renderer
let renderer: WebGLRenderer;

const waterGeometry = new PlaneGeometry(10000, 10000);

const water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new TextureLoader().load('static/normals/waternormals.jpeg', function (texture) {
            texture.wrapS = texture.wrapT = MirroredRepeatWrapping;
        }),
        sunDirection: new Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
);


//Need animation loop to move objects on the screen as we need
//we’ll need the render loop to draw new frames to the screen
//Why requestAnimationFrame: one of the main reasons= to pause our game if the user changes tabs, 
    //which will improve performance and reduce possibly wasting resources on the device
const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera); //rendering the scene
}

///Initial setup for our scene, and only runs once (when the game is first loaded)
async function init() {
    renderer = new WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Water
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = 0;
    scene.add(water);

    const sun = new Vector3();
    const light = new HemisphereLight(0xffffff, 0x444444, 1.0);
    light.position.set(0, 1, 0);
    scene.add(light);
    
    //Sky
    const sky = new Sky();
    sky.scale.setScalar(10000); // Specify the dimensions of the skybox
    scene.add(sky); // Add the sky to our scene

    // Set up variables to control the look of the sky
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        elevation: 3,
        azimuth: 115
    };

    const pmremGenerator = new PMREMGenerator(renderer);

    const phi = MathUtils.degToRad(90 - parameters.elevation);
    const theta = MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    (water.material as ShaderMaterial).uniforms['sunDirection'].value.copy(sun).normalize();
    scene.environment = pmremGenerator.fromScene(sky as any).texture;

    (water.material as ShaderMaterial).uniforms['speed'].value = 0.0;
}