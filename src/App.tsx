import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";
import { appCacheDir } from "@tauri-apps/api/path";
import { writeFile } from "@tauri-apps/plugin-fs";
import { load } from "@tauri-apps/plugin-store";

function App() {
  const searchRef = useRef<HTMLInputElement>(null);

  const [index, setIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isHD, setIsHD] = useState(false);
  const [isConfig, setIsConfig] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const searchHandler = () => {
    fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(searchQuery)}&limit=10&bundle=low_bandwidth`,
    )
      .then((response) => response.json())
      .then((data) =>
        setGifs(
          data.data.map(
            (gif: any) =>
              gif.images[isHD ? "downsized" : "fixed_width_small"].url,
          ),
        ),
      );
  };

  async function handleCopy() {
    try {
      const gifUrl = gifs[index];
      const response = await fetch(gifUrl);
      const arrayBuffer = await response.arrayBuffer();
      const cacheDir = await appCacheDir();
      const filePath = `${cacheDir}\\temp_clip.gif`;
      await writeFile(filePath, new Uint8Array(arrayBuffer));
      await invoke("copy_gif_file", { path: filePath });

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (gifs.length === 0) {
      setIndex(-1);
    }
  }, [gifs]);

  useEffect(() => {
    setGifs([]);
    setSearchQuery("");
  }, [isHD]);

  useEffect(() => {
    if (apiKey != "") {
      const saveApiKey = async () => {
        const store = await load("config.json");
        await store.set("apiKey", apiKey);
      };
      saveApiKey();
    }
  }, [apiKey]);

  useEffect(() => {
    searchRef.current?.focus();
    const loadApiKey = async () => {
      const store = await load("config.json");
      const value = await store.get<string>("apiKey");
      setApiKey(value ?? "");
    };
    loadApiKey();
  }, []);

  const debouncedSearch = useCallback(() => {
    const handle = setTimeout(() => {
      searchHandler();
    }, 500);
    return handle;
  }, [searchQuery]);

  useEffect(() => {
    const handle = debouncedSearch();
    return () => clearTimeout(handle);
  }, [searchQuery]);

  return (
    <>
      <div className="flex justify-end py-1 px-2 items-center">
        <div className="flex gap-1 w-full items-center">
          <div className="draggable text-gray-500 text-nowrap">
            Giffos v0.1.6
          </div>
          <div className="flex flex-row gap-1">
            <label className="text-gray-200" htmlFor="hdEnabled">
              HD
            </label>
            <input
              id="hdEnabled"
              type="checkbox"
              checked={isHD}
              onChange={() => setIsHD(!isHD)}
            ></input>
          </div>
        </div>
        <div className="draggable flex w-full justify-end">
          <img
            className="draggable max-h-4 w-fit cursor-default"
            src="/giphy.png"
          />
        </div>
        <button
          className={`me-2 p-1 rounded-md ${isConfig ? "bg-blue-500 text-white" : "text-white"}`}
          onClick={() => setIsConfig(!isConfig)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-gray-50 hover:stroke-blue-600"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
            <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
          </svg>
        </button>
        <button onClick={() => invoke("close_window")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="stroke-gray-50 hover:stroke-red-600"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>
      {isConfig ? (
        <>
          <div className="flex flex-col h-[calc(100vh-36px)] p-4">
            <label className="mr-2 mb-1 text-gray-50" htmlFor="apiKey">
              GIPHY API Key
            </label>
            <input
              type="text"
              id="apiKey"
              className="w-full p-1 rounded bg-gray-800 text-gray-50"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2 justify-center w-full h-full px-5 text-gray-50">
            <div className="w-full justify-items-center h-32 bg-black/50 rounded">
              {index === -1 && (
                <div className="w-full h-full justify-center content-center text-center text-gray-500">
                  No GIF preview
                </div>
              )}
              {index !== -1 && (
                <img className="h-full" src={gifs[index]} alt="GIF" />
              )}
            </div>
            <input
              ref={searchRef}
              id="search"
              value={searchQuery}
              className="w-full p-1 rounded bg-gray-800"
              placeholder="Search any GIF"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="carousel h-22 flex gap-2 w-full h-full overflow-x-auto py-2">
              {gifs.map((gif, i) => (
                <img
                  key={i}
                  src={gif}
                  alt="GIF"
                  className="w-22 h-12 rounded"
                  onClick={() => setIndex(i)}
                />
              ))}
              {gifs.length == 0 && (
                <div className="w-full h-16 justify-center content-center text-center text-gray-500">
                  No GIFs found
                </div>
              )}
            </div>
            <div className="flex flex-col w-full h-full gap-2">
              <button
                className="flex w-full justify-center p-2 cursor-pointer rounded border hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-500/50 disabled:text-gray-500"
                onClick={() => handleCopy()}
                disabled={index === -1}
              >
                {copied
                  ? "Copied!"
                  : index === -1
                    ? "Select GIF for Copy"
                    : "Copy GIF"}
              </button>
              <div className="flex w-full justify-end content-end items-end text-gray-500/50 py-2">
                Made with ❤️ by DavidArtifacts
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default App;
