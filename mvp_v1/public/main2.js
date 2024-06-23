import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export function initThreeJS() {
    const container = document.getElementById("animation");
    if (!container) {
        console.error("Container element not found");
        return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x053238);

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 100);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    let handModelRight;
    let rightSpheres = [];

    function setHandColor(model, color) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshPhongMaterial({ color: color });
            }
        });
    }

    fetch('./ref2.json')
        .then(response => response.json())
        .then(data => {
            const frames = data;
            const firstFrame = frames[0];
            const rightLandmarks = firstFrame.right_hand_landmarks;

            loader.load('./hand.glb', (gltf) => {
                handModelRight = gltf.scene;
                scene.add(handModelRight);
                handModelRight.scale.set(-10, 10, 10); // Mirror and scale the right hand
                setHandColor(handModelRight, 0xFF0000); // Red for right hand

                rightLandmarks.forEach((point, index) => {
                    const sphere = createLabeledSphere(point, index + 1, 0xFF0000); // Red for right hand
                    rightSpheres.push(sphere);
                });

                let frameIndex = 0;
                function update() {
                    if (frameIndex < frames.length) {
                        const frame = frames[frameIndex];
                        const nextRightLandmarks = frame.right_hand_landmarks;

                        if (handModelRight && nextRightLandmarks.length > 0) {
                            updateHandModel(handModelRight, nextRightLandmarks, rightSpheres);
                        }

                        frameIndex++;
                    } else {
                        frameIndex = 0; // Loop back to the beginning
                    }
                }

                setInterval(update, 100); // Update every 100ms for animation
                render();
            }, undefined, (error) => {
                console.error('Error loading hand model:', error);
            });
        });

    function createLabeledSphere(position, index, color) {
        const geometry = new THREE.SphereGeometry(1, 32, 32); // Enlarged sphere
        const material = new THREE.MeshBasicMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(position[0] * 100, -position[1] * 100, -position[2] * 100);
        scene.add(sphere);

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = '48px Arial';
        context.fillStyle = 'white';
        context.fillText(index.toString(), 0, 48);
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.SpriteMaterial({ map: texture });
        const label = new THREE.Sprite(labelMaterial);
        label.position.copy(sphere.position);
        label.position.y += 2;
        label.scale.set(5, 5, 5);
        scene.add(label);

        return sphere;
    }

    function updateHandModel(handModel, landmarks, spheres) {
        // Update the hand model's position based on the wrist landmark (index 0)
        const wrist = new THREE.Vector3(landmarks[0][0], -landmarks[0][1], -landmarks[0][2]);
        handModel.position.copy(wrist.multiplyScalar(100));

        // Define finger joints
        const fingerJoints = [
            [0, 1, 2, 3, 4],         // Thumb
            [0, 5, 6, 7, 8],         // Index
            [0, 9, 10, 11, 12],      // Middle
            [0, 13, 14, 15, 16],     // Ring
            [0, 17, 18, 19, 20]      // Pinky
        ];

        // Update each finger
        fingerJoints.forEach((finger, fingerIndex) => {
            for (let i = 1; i < finger.length; i++) {
                const jointName = `finger_${fingerIndex}_joint_${i-1}`;
                const joint = handModel.getObjectByName(jointName);
                if (joint) {
                    const start = new THREE.Vector3(landmarks[finger[i-1]][0], -landmarks[finger[i-1]][1], -landmarks[finger[i-1]][2]);
                    const end = new THREE.Vector3(landmarks[finger[i]][0], -landmarks[finger[i]][1], -landmarks[finger[i]][2]);
                    
                    const direction = end.clone().sub(start).normalize();
                    const length = end.distanceTo(start);

                    joint.position.copy(start.sub(wrist).multiplyScalar(100));
                    joint.scale.z = length * 100;
                    joint.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
                }
            }
        });

        // Update sphere positions
        landmarks.forEach((point, index) => {
            if (index < spheres.length) {
                spheres[index].position.set(point[0] * 100, -point[1] * 100, -point[2] * 100);
            }
        });
    }

    function render() {
        requestAnimationFrame(render);
        controls.update();
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}