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

// latest graph: https://www.desmos.com/calculator/vbb1xlav4s

(function() {
    'use strict';

    let renderer, Calc, THREE, scene, camera, lookAt, light, ambientLight;
    let meshData = []

    function observeCamera() {
        for (let c=0; c<3; c++) {
            Calc.HelperExpression({latex: `\\xi_{cam${"XYZ"[c]}}`})
            .observe('numericValue', (_, {numericValue}) => {
                camera.position["xyz"[c]] = numericValue;
                camera.lookAt(lookAt);
                rerender()
            })
            Calc.HelperExpression({latex: `\\xi_{lookAt${"XYZ"[c]}}`})
            .observe('numericValue', (_, {numericValue}) => {
                lookAt["xyz"[c]] = numericValue;
                camera.lookAt(lookAt);
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
        rerender()
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
        // Undoubtedly storing mesh.vertices is slower and takes more space
        mesh.geometry.setAttribute('position', new THREE.BufferAttribute(mesh.vertices, 3))
        mesh.geometry.deleteAttribute('normal')
        mesh.geometry.computeFaceNormals();
        mesh.geometry.computeVertexNormals();
        mesh.geometry.normalizeNormals();
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
                const material = new THREE.MeshLambertMaterial({
                  color: 0x00ff00,
                  side: THREE.DoubleSide,
                });
                const mesh = new THREE.Mesh(meshData[i].geometry, material);
                scene.add(mesh);
            }
        } else if (numMeshes < meshData.length) {
            for (let i=numMeshes; i<meshData.lenth; i++) {
                meshData[i].helper.unobserve('listValue');
                meshData[i].geometry.dispose();
            }
            meshData.splice(numMeshes)
        }
    }

    function observeMeshes() {
        Calc.HelperExpression({latex: `\\xi_{numMeshes}`})
            .observe('numericValue', (_, {numericValue}) => updateNumMeshes(numericValue))
    }

    function updateLightPos(coordinate, value) {
      if (coordinate == 0) light.position.setX(value)
      else if (coordinate == 1) light.position.setY(value)
      else if (coordinate == 2) light.position.setZ(value)
      rerender();
    }

    function updateLightIntensity(value) {
      light.intensity = value;
      rerender();
    }

    function updateAmbientLightIntensity(value) {
      ambientLight.intensity = value;
      rerender();
    }

    function observeLights() {
        light = new THREE.PointLight(0xffffff, 0)
        scene.add(light)

        ambientLight = new THREE.AmbientLight(0xffffff, 0)
        scene.add(ambientLight)

        for (let c=0; c<3; c++) {
          Calc.HelperExpression({latex: `\\xi_{light${"XYZ"[c]}}`})
            .observe('numericValue', (_, {numericValue}) => updateLightPos(c, numericValue))
        }
        Calc.HelperExpression({latex: `\\xi_{lightIntensity}`})
          .observe('numericValue', (_, {numericValue}) => updateLightIntensity(numericValue))
        Calc.HelperExpression({latex: `\\xi_{ambientLightIntensity}`})
          .observe('numericValue', (_, {numericValue}) => updateAmbientLightIntensity(numericValue))
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
        lookAt = new THREE.Vector3(0, 0, 0);

        renderer = new THREE.WebGLRenderer();

        renderer.domElement.style.position = 'absolute';
        const container = document.querySelector(".dcg-container")
        container.prepend(renderer.domElement);
        container.querySelector(".dcg-grapher").style.opacity = 0.5;

        applyGraphpaperBounds()
        Calc.observe('graphpaperBounds', applyGraphpaperBounds);
        observeCamera()
        observeMeshes()
        observeLights()

        rerender()
    }

    const waitInterval = setInterval(() => {
        if (window.Calc) {
            clearInterval(waitInterval)
            init()
        }
    }, 50)
})();
