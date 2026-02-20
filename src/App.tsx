import { invoke } from "@tauri-apps/api/core";
import { appCacheDir } from "@tauri-apps/api/path";
import { currentMonitor, getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import { writeFile } from "@tauri-apps/plugin-fs";
import { load } from "@tauri-apps/plugin-store";
import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const searchRef = useRef<HTMLInputElement>(null);

  const [index, setIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isHD, setIsHD] = useState(false);
  const [isConfig, setIsConfig] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const initWindow = async () => {
      try {
        const win = getCurrentWindow();
        const monitor = await currentMonitor();
        if (monitor) {
          const { width, height } = monitor.size;
          const size = await win.outerSize();
          const x = width - size.width - 24;
          const y = height - size.height - 48; // Accounting for taskbar roughly
          await win.setPosition(new PhysicalPosition(x, y));
        }
      } catch (e) {
        console.error("Window reposition failed", e);
      }
    };
    initWindow();
  }, []);

  const searchHandler = (offsetParam: number = 0, append: boolean = false) => {
    fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(searchQuery)}&limit=10&offset=${offsetParam}&bundle=low_bandwidth`,
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.data) return;
        setGifs((prev) => {
          const newGifs = data.data.map(
            (gif: any) =>
              gif.images[isHD ? "downsized" : "fixed_width_small"].url,
          );
          return append ? [...prev, ...newGifs] : newGifs;
        });
      })
      .catch((err) => console.error("Search failed", err));
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
      console.error("Copy failed", err);
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
      if (searchQuery.trim().length === 0) {
        setGifs([]);
        return;
      }
      setOffset(0);
      searchHandler(0, false);
    }, 500);
    return handle;
  }, [searchQuery, apiKey, isHD]);

  useEffect(() => {
    const handle = debouncedSearch();
    return () => clearTimeout(handle);
  }, [searchQuery, debouncedSearch]);

  return (
    <>
      <div className="scanline"></div>

      {/* HEADER */}
      <div className="flex justify-between py-2 px-3 items-center border-b border-[var(--border-dim)] bg-[rgba(0,0,0,0.5)] z-10 relative">
        <div className="flex gap-4 w-full items-center">
          <div className="draggable font-mono text-[11px] text-[var(--accent)] font-bold tracking-widest uppercase">
            Giffos v0.1.7
          </div>
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              className="checkbox-input"
              checked={isHD}
              onChange={() => setIsHD(!isHD)}
            />
            HD Quality
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`p-1 z-20 cursor-pointer transition-all rounded-sm ${isConfig ? "text-[var(--bg-color)] bg-[var(--accent)] shadow-[0_0_8px_var(--accent-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[rgba(255,255,255,0.1)]"
              }`}
            onClick={() => setIsConfig(!isConfig)}
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
              <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
            </svg>
          </button>
          <button
            className="p-1 z-20 cursor-pointer text-[var(--text-muted)] hover:text-[#FF2A2A] transition-colors"
            onClick={() => invoke("close_window")}
            title="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {isConfig ? (
        <div className="flex flex-col flex-1 px-3 pt-4 pb-2 z-10 relative bg-[rgba(0,0,0,0.6)] backdrop-blur-md">
          <div className="font-mono text-[11px] text-[var(--accent)] mb-6 tracking-widest uppercase border-b border-[var(--accent)] pb-1 inline-block w-fit">
            Settings
          </div>
          <div className="flex flex-col gap-2 flex-grow">
            <label className="font-mono text-[10px] text-[var(--text-muted)] tracking-wider">
              Giphy API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                className="industrial-input w-full p-3 pr-10 text-sm"
                value={apiKey}
                placeholder="Enter your API key"
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] z-10"
                onClick={() => setShowApiKey(!showApiKey)}
                title="Toggle API Key visibility"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                  {showApiKey ? (
                    <>
                      <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
                      <path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" />
                      <path d="M3 3l18 18" />
                    </>
                  ) : (
                    <>
                      <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                      <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            <p className="font-mono text-[9px] text-[var(--text-muted)] mt-1 opacity-60">
              * Required to search and fetch GIFs
            </p>
          </div>
          <div className="mt-auto flex justify-center items-center text-[10px] font-mono tracking-widest text-[var(--text-muted)]">
            <div className="flex items-center gap-1 opacity-70">
              <span className="uppercase">Made by</span>
              <a
                href="https://github.com/artifacts-dav"
                target="_blank"
                className="text-[var(--accent)] hover:underline"
              >
                artifacts-dav
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 px-3 pt-3 pb-2 gap-3 z-10 relative">

          {/* SEARCH INPUT */}
          <div className="relative">
            <input
              ref={searchRef}
              id="search"
              value={searchQuery}
              className="industrial-input w-full p-3 pl-4 pr-10 text-sm"
              placeholder="Search GIFs..."
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-mono text-[var(--accent)] opacity-50 tracking-widest">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M21 21l-6 -6" /></svg>
            </div>
            {/* Minimalist Decoration */}
            <div className="absolute left-0 bottom-0 w-2 h-px bg-[var(--accent)]"></div>
          </div>

          {/* MAIN PREVIEW */}
          <div className="gif-container w-full h-36 flex-shrink-0 flex items-center justify-center relative bg-[rgba(0,0,0,0.4)]">
            {index === -1 ? (
              <div className="font-mono text-[11px] text-[var(--text-muted)] tracking-widest relative z-10 flex flex-col items-center gap-2 uppercase">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-50">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                No Preview
              </div>
            ) : (
              <img className="h-full w-full object-contain z-10 p-2 mix-blend-screen" src={gifs[index]} alt="GIF_PREVIEW" />
            )}

            {/* Corner Markers */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[var(--accent)] opacity-50"></div>
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[var(--accent)] opacity-50"></div>
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[var(--accent)] opacity-50"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[var(--accent)] opacity-50"></div>
          </div>

          {/* CAROUSEL */}
          <div className="carousel h-20 flex gap-2 w-full overflow-x-auto overflow-y-hidden border border-[var(--border-dim)] p-1 bg-[rgba(0,0,0,0.5)] items-center">
            {gifs.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
                Search for GIFs...
              </div>
            ) : (
              <>
                {gifs.map((gif, i) => (
                  <img
                    key={i}
                    src={gif}
                    alt={`Thumbnail ${i}`}
                    className={`gif-thumbnail h-full object-cover aspect-video rounded-sm ${i === index ? 'active' : ''}`}
                    onClick={() => setIndex(i)}
                  />
                ))}

                <button
                  className="industrial-btn h-full px-5 flex-shrink-0 text-[10px] tracking-wider"
                  onClick={() => {
                    const newOffset = offset + 10;
                    setOffset(newOffset);
                    searchHandler(newOffset, true);
                  }}
                >
                  Load More
                </button>
              </>
            )}
          </div>

          {/* COPY ACTION & FOOTER */}
          <div className="flex flex-col gap-3">
            <button
              className="industrial-btn w-full py-3 text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => handleCopy()}
              disabled={index === -1}
            >
              {copied
                ? "Copied!"
                : index === -1
                  ? "Select a GIF"
                  : "Copy GIF"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
