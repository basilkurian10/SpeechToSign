// pages/index.js

"use client";

import { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'boxicons/css/boxicons.min.css';
import Head from 'next/head';

export default function Home() {
  const textBoxRef = useRef(null);
  const [text, setText] = useState('Generated text appears here');

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [animateButton,setAnimateButton]=useState(false)


  useEffect(() => {
    const loadThreeJS = async () => {
      const module = await import('../public/main.js');
      module.initThreeJS();
    };

    loadThreeJS();
  }, [animateButton]);


  const handleDragEnter = (e:any) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
  };

  const handleDragLeave = (e:any) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
  };

  const handleDragOver = (e:any) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDrop = (e:any) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
          setSelectedFile(files[0]);
      }
  };

  const animate=(e:any)=>{
    setAnimateButton(true)
  }

  const handleFileChange = (e:any) => {
      setSelectedFile(e.target.files[0]);
  };

  const LoadingSpinner = () => (
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 "></div>
);

  const handleSubmit = async (event:any) => {
    event.preventDefault();
    console.log(selectedFile)
    setLoading(true);

    
    const formData = new FormData();
    formData.append('audioFile', selectedFile);

    if (!selectedFile) {
      console.error('No file selected');
      return;
    }

    try {
      const response = await fetch('/api/python', {
        method: 'POST',
        body: formData,
      });

      console.log("response", response.body)


      const reader =response.body.getReader();
      const textDecoder = new TextDecoder();
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        result += textDecoder.decode(value, { stream: true });
      }
      console.log(JSON.parse(result))
      setText(JSON.parse(result).text)
      setLoading(false);
   

    
      if (response.ok) {
        console.log('File uploaded successfully');
        setUploadStatus('File uploaded successfully!');

      } else {
        console.error('File upload failed');
        setUploadStatus('Failed to upload file.');

      }
    } catch (error) {
      console.error('An error occurred while uploading the file:', error);
    }
  };
  

  return (
    <>
      <Head>
        <title>Signify - Home</title>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="/css/home.css" />
      </Head>
      <nav className="navbar bg-body-tertiary">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <img
            width={120}
            height={120}
              src="../signify-logo-footer.avif"
              alt="Signify Logo"
            />
          </a>
        </div>
      </nav>
      <section id="container-fluid">
        <section id="left-panel" className="container-fluid">
          <div className='flex justify-between w-full'>
          <button type="button" className="btn btn-primary" id="mic-button" disabled>
            🎤 Start Recording
          </button>
          <button type="button" className="btn btn-primary" id="submit-button" disabled>
            Submit
          </button>
          </div>
          <div className="mt-1 max-w-lg mx-auto p-4 bg-white shadow-lg rounded-lg">
            <div
                className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    dragging ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-gray-50'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <p className="mb-2 text-gray-600">Drag and drop your file here</p>
                <p className="mb-2 text-gray-600">or</p>
                <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="fileInput"
                />
                <label
                    htmlFor="fileInput"
                    className="cursor-pointer inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    Browse Files
                </label>
            </div>
            {selectedFile && (
                <div className="">
                    <p className="text-gray-700">File name: {selectedFile.name}</p>
                </div>
            )}
            <div className="mt-2">
                <button
                    onClick={handleSubmit}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                    Upload File
                </button>
            </div>
        </div>



          {/* <form onSubmit={handleSubmit}>
            <input type="file" onChange={handleFileChange} />
            <button type="submit" className="btn btn-primary mt-2">Upload</button>
          </form> */}

<div className="relative">
 <textarea value={text} 
 className="form-control border-gray-300 focus:ring-blue-500 focus:border-blue-500 w-96 h-40 p-4 rounded-lg"

 id="text-box" rows="10" cols="30" ref={textBoxRef}>
 
 </textarea>
 {loading ?  <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'><LoadingSpinner/> </div>: null}

 </div>
 
          
          <button onClick={animate}
           type="button" className="btn btn-primary" id="signify-button">
            Signify
          </button>
        </section>
        <div className="separator"></div>
        <section id="right-panel" className="container-fluid text-center">
          <h4 className="text-center">Signify Animation</h4>
          <button type="button" className="btn btn-primary text-center" id="play-pause-button" disabled>
            Play/Pause
          </button>
          {animateButton ?
          <>
          <h1 id="label"></h1>
          <div className='w-full h-90' id="animation"></div>
          </>
          : 
          <>
          <div className="mt-2 h-3/4 mt-1 max-w-lg mx-auto p-4 bg-white shadow-lg rounded-lg"></div>
          </>}
        </section>
      </section>
    </>
  );
}
