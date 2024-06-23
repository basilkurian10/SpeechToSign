import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export function initThreeJS() {
    var label = document.getElementById("label");
    var container = document.getElementById("animation");

    const fov = 75;
    const aspect = container?.clientWidth / container?.clientHeight;
    const near = 0.1;
    const far = 1000;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x053238);

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x004040);
    scene.add(ambientLight);

    renderer.setSize(container?.clientWidth, container?.clientHeight);
    container?.appendChild(renderer.domElement);

    var wordList = [];
    var wordidx = 0;
    var frameidx = 0;

    fetch('/ref2.json')
        .then((response) => response.json())
        .then((data) => {
            function drawPoint(x, y, z) {
                const pointRadius = 0.25;
                const geometry = new THREE.SphereGeometry(pointRadius, 32, 16);
                const material = new THREE.MeshBasicMaterial({ color: 0x84ffff });
                const sphere = new THREE.Mesh(geometry, material);
                scene.add(sphere);
                sphere.position.set(x, y, z);
            }

            function drawLine(x1, y1, z1, x2, y2, z2) {
                const points = [];
                points.push(new THREE.Vector3(x1, y1, z1));
                points.push(new THREE.Vector3(x2, y2, z2));
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({ color: 0xffffff });
                const line = new THREE.Line(geometry, material);
                scene.add(line);
            }

            function redistributeElements(left, right) {
                if (left.length > 21) {
                    const redistributedElements = left.splice(21);
                    right.push(...redistributedElements);
                } else if (right.length > 21) {
                    const redistributedElements = right.splice(21);
                    left.push(...redistributedElements);
                }
            }

            function connectLines(frame) {
                const edgeList = [
                    [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
                    [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15],
                    [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
                ];

                var left = frame['left_hand_landmarks'];
                var right = frame['right_hand_landmarks'];
                redistributeElements(left, right);

                edgeList.forEach(function (edge) {
                    const u = edge[0];
                    const v = edge[1];
                    if (left[u] && left[v]) {
                        const l1 = left[u];
                        const l2 = left[v];
                        drawLine(l1[0] * 50, l1[1] * -50, l1[2] * 50, l2[0] * 50, l2[1] * -50, l2[2] * 50);
                    }
                    if (right[u] && right[v]) {
                        const r1 = right[u];
                        const r2 = right[v];
                        drawLine(r1[0] * 50, r1[1] * -50, r1[2] * 50, r2[0] * 50, r2[1] * -50, r2[2] * 50);
                    }
                });
            }

            let clock = new THREE.Clock();
            let delta = 0;
            let interval = 1 / 20;
            const loader = new GLTFLoader();
            let handModelLeft, handModelRight, skeleton1, skeleton2;

            loader.load('./public/hand.glb', function (gltf) {
                handModelLeft = gltf.scene;
                scene.add(handModelLeft);
                skeleton1 = new THREE.SkeletonHelper(handModelLeft);
                scene.add(skeleton1);
                handModelLeft.position.set(10, -0.2, -0.5);
                handModelLeft.rotation.set(THREE.Math.degToRad(-50), THREE.Math.degToRad(0), THREE.Math.degToRad(-20));
            }, undefined, function (error) {
                console.error('error', error);
            });

            loader.load('./static/hand.glb', function (gltf) {
                handModelRight = gltf.scene;
                scene.add(handModelRight);
                skeleton2 = new THREE.SkeletonHelper(handModelRight);
                scene.add(skeleton2);
                handModelRight.scale.set(-1, 1, 1);
                handModelRight.position.set(-10, -0.2, -0.5);
                handModelRight.rotation.set(THREE.Math.degToRad(-50), THREE.Math.degToRad(0), THREE.Math.degToRad(20));
            }, undefined, function (error) {
                console.error(error);
            });

            function updateHandModel(handModel, landmarks) {
                if (handModel && landmarks.length > 0) {
                    handModel.position.set(landmarks[0][0] * 50, landmarks[0][1] * -50, landmarks[0][2] * 50);
                    // Additional code to update rotation and other joints if necessary
                }
            }

            function render() {
                requestAnimationFrame(render);
                delta += clock.getDelta();
                if (delta > interval) {
                    delta = delta % interval;
                    if (data.length > 0 && frameidx < data.length) {
                        var frame = data[frameidx];
                        var left = frame['left_hand_landmarks'];
                        var right = frame['right_hand_landmarks'];
                        left.forEach(function (joint) {
                            drawPoint(joint[0] * 50, joint[1] * -50, joint[2] * 50);
                        });
                        right.forEach(function (joint) {
                            drawPoint(joint[0] * 50, joint[1] * -50, joint[2] * 50);
                        });
                        connectLines(frame);
                        updateHandModel(handModelLeft, left);
                        updateHandModel(handModelRight, right);
                        frameidx++;
                    }
                }
                renderer.render(scene, camera);
                scene.children.forEach((child) => {
                    if (child.type === 'Mesh' || child.type === 'Line') {
                        scene.remove(child);
                    }
                });
            }

            render();
            camera.position.set(27.5, -30, 25);
        });
}