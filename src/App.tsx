import { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function App() {
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synth.getVoices();

      const maleVoice =
        voices.find(
          (v) =>
            v.lang === "en-US" &&
            (v.name.toLowerCase().includes("david") ||
              v.name.toLowerCase().includes("male"))
        ) || voices.find((v) => v.lang.startsWith("en"));

      setSelectedVoice(maleVoice || voices[0]);
    };

    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }, []);

  const handleFile = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = async function () {
      const typedarray = new Uint8Array(this.result as ArrayBuffer);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;

      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => item.str);
        fullText += strings.join(" ") + " ";
      }

      const splitSentences = fullText
        .replace(/\s+/g, " ")
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.trim() !== "");

      setSentences(splitSentences);
    };

    reader.readAsArrayBuffer(file);
  };

  const speak = () => {
    if (!sentences.length) return;

    const synth = window.speechSynthesis;
    synth.cancel();
    setIsPlaying(true);

    sentences.forEach((sentence, index) => {
      const utter = new SpeechSynthesisUtterance(sentence);

      if (selectedVoice) utter.voice = selectedVoice;

      utter.lang = "en-US";
      utter.rate = rate;
      utter.pitch = 0.9;

      utter.onstart = () => setCurrentIndex(index);

      if (index === sentences.length - 1) {
        utter.onend = () => {
          setIsPlaying(false);
          setCurrentIndex(-1);
        };
      }

      synth.speak(utter);
    });
  };

  const pause = () => window.speechSynthesis.pause();
  const resume = () => window.speechSynthesis.resume();

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentIndex(-1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(135deg,#4e73df,#9b59b6,#e056fd)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px"
      }}
    >
      <div
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          padding: "40px 80px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          color: "white"
        }}
      >
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>
          🎧 AI Study Reader
        </h1>

        <p style={{ opacity: 0.9 }}>
          Convert your PDFs into natural spoken audio instantly.
        </p>

        {/* Upload */}
        <div style={{ marginTop: "30px" }}>
          <label
            style={{
              padding: "12px 28px",
              background: "#ffffff",
              color: "#4e73df",
              borderRadius: "30px",
              cursor: "pointer",
              fontWeight: "bold",
              display: "inline-block"
            }}
          >
            Upload PDF
            <input
              type="file"
              accept=".pdf"
              onChange={handleFile}
              style={{ display: "none" }}
            />
          </label>

          {fileName && (
            <span style={{ marginLeft: "15px" }}>
              📄 {fileName}
            </span>
          )}
        </div>

        {/* Speed */}
        <div style={{ marginTop: "30px" }}>
          <label>Speed: {rate}x</label>

          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {/* Controls */}
        <div style={{ marginTop: "25px" }}>
          <Button color="#00c6ff" onClick={speak}>
            ▶ Play
          </Button>

          <Button color="#ff9f43" onClick={pause}>
            ⏸ Pause
          </Button>

          <Button color="#1dd1a1" onClick={resume}>
            ⏯ Resume
          </Button>

          <Button color="#ff4757" onClick={stop}>
            ⛔ Stop
          </Button>
        </div>

        {/* Text display */}
        <div
          style={{
            marginTop: "30px",
            maxHeight: "350px",
            overflowY: "auto",
            background: "rgba(255,255,255,0.2)",
            padding: "20px",
            borderRadius: "15px"
          }}
        >
          {sentences.map((sentence, index) => (
            <p
              key={index}
              style={{
                background:
                  currentIndex === index ? "#ffe066" : "transparent",
                padding: "6px",
                borderRadius: "6px",
                color: currentIndex === index ? "black" : "white"
              }}
            >
              {sentence}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Button({
  color,
  onClick,
  children
}: {
  color: string;
  onClick: () => void;
  children: any;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        marginRight: "12px",
        padding: "12px 22px",
        border: "none",
        borderRadius: "30px",
        background: color,
        color: "white",
        fontWeight: "bold",
        cursor: "pointer"
      }}
    >
      {children}
    </button>
  );
}

export default App;