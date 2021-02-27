// ==UserScript==
// @name         Desmos Three.js
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Use three.js directly in Desmos
// @author       You
// @match        https://www.desmos.com/calculator/*
// @require      https://threejs.org/build/three.js
// @grant        none
// ==/UserScript==

// TODO: change the @require build of three.js to point to a specific version

(function() {
    'use strict';

    let renderer, Calc, THREE, scene, camera;
    let meshData = [];

    function observeCamera() {
        for (let c=0; c<3; c++) {
            Calc.HelperExpression({latex: `\\xi_{cam${"XYZ"[c]}}`})
            .observe('numericValue', (_, {numericValue}) => {
                camera.position["xyz"[c]] = numericValue;
                camera.lookAt(0, 0, 0);
                rerender()
            })
        }
    }

    function applyGraphpaperBounds() {
        const bounds = Calc.graphpaperBounds.pixelCoordinates;
        renderer.setSize(bounds.width, bounds.height);
        renderer.domElement.width = bounds.width;
        renderer.domElement.height = bounds.height;
        // top is always 0
        renderer.domElement.style.left = bounds.left + "px";
        camera.aspect = bounds.width / bounds.height;
        camera.updateProjectionMatrix();
    }

    function updateMesh(index, coordinate, listValue) {
        if (listValue === undefined) {
            return;
        }
        const mesh = meshData[index];
        if (mesh.vertices.length !== 3*listValue.length) {
            // assume that the other two mesh values will be updated before the next render in Desmos
            mesh.vertices = new Float32Array(3*listValue.length);
        }
        for (let i=0; i<listValue.length; i++) {
            mesh.vertices[3*i + coordinate] = listValue[i]
        }
        mesh.changed = true
        // TODO: interface directly with the BufferAttribute.array?
        mesh.geometry.setAttribute('position', new THREE.BufferAttribute(mesh.vertices, 3))
        rerender();
    }

    function updateNumMeshes(numMeshes) {
        numMeshes = Math.floor(numMeshes);

        if (numMeshes > meshData.length) {
            for (let i=meshData.length; i < numMeshes; i++) {
                meshData.push({
                    helpers: [null, null, null],
                    vertices: new Float32Array(0),
                    changed: false,
                    geometry: new THREE.BufferGeometry(),
                })
                for (let c=0; c<3; c++) {
                    const helper = Calc.HelperExpression({latex: `\\xi_{mesh${"XYZ"[c]}${i}}`});
                    helper.observe('listValue', (_, {listValue}) => {
                        updateMesh(i, c, listValue);
                    })
                    meshData[i].helpers[c] = helper
                }
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const mesh = new THREE.Mesh(meshData[i].geometry, material);
                scene.add(mesh);
            }
        } else if (numMeshes < meshData.length) {
            for (let i=numMeshes; i<meshData.lenth; i++) {
                meshData[i].helper.unobserve('listValue');
            }
            meshData.splice(numMeshes)
        }
    }

    function observeMeshes() {
        Calc.HelperExpression({latex: `\\xi_{numMeshes}`})
            .observe('numericValue', (_, {numericValue}) => updateNumMeshes(numericValue))
    }

    function rerender() {
        console.log(scene, camera, meshData);
        // TODO: have an async loop of re-rendering to avoid several updates stacking up (e.g. if xi_camX, xi_camY, and xi_camZ all change at the same time)
        renderer.render(scene, camera);
    }

    function init() {
        THREE = window.THREE
        Calc = window.Calc

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
            75, // FOV (degrees)
            1, // aspect ratio, temp until first `applyGraphpaperBounds`
            0.1, 1000 // clipping plane
        );

        renderer = new THREE.WebGLRenderer();

        renderer.domElement.style.position = 'absolute';
        const container = document.querySelector(".dcg-container")
        container.prepend(renderer.domElement);
        container.querySelector(".dcg-grapher").style.opacity = 0.5;

        applyGraphpaperBounds()
        Calc.observe('graphpaperBounds', applyGraphpaperBounds);
        observeCamera()
        observeMeshes()

        rerender()
    }

    const waitInterval = setInterval(() => {
        if (window.Calc) {
            clearInterval(waitInterval)
            init()
        }
    }, 50)
})();
