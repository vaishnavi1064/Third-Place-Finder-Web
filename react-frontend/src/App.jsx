import { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import MapViewer from './components/MapViewer';
import AudioMixer from './components/AudioMixer';

function App() {
  const [leftWidth, setLeftWidth] = useState('25%');
  const [rightWidth, setRightWidth] = useState('20%');
  const [showResults, setShowResults] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // The resizing logic below is designed for pixel-based widths.
  // If leftWidth, centerWidth, rightWidth are intended to be percentages,
  // this useEffect would need significant modification to handle percentage-based resizing.
  // For now, keeping the original pixel-based resizing logic, which means
  // the initial percentage values for leftWidth/centerWidth/rightWidth will be overridden
  // by pixel values if resizing occurs.
  // A more robust solution would involve calculating percentages from pixel values during resize.
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingLeft && !isResizingRight) return;

      // This pixel-based resizing logic conflicts with percentage-based initial widths.
      // If percentage widths are desired, this logic needs to be re-written.
      // For now, it will set pixel values for leftWidth/rightWidth if resizing occurs.
      if (isResizingLeft) {
        // Assuming leftWidth is still managed as a number for resizing
        setLeftWidth(Math.max(300, Math.min(800, e.clientX)) + 'px'); // Convert to pixel string
      } else if (isResizingRight) {
        // Assuming rightWidth is still managed as a number for resizing
        setRightWidth(Math.max(250, Math.min(600, window.innerWidth - e.clientX)) + 'px'); // Convert to pixel string
      }
    };
    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      document.body.style.cursor = '';
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isResizingLeft, isResizingRight]);

  return (
    <div className="h-full w-full flex flex-col md:flex-row relative z-10 gap-6 items-stretch p-0">
      {/* LEFT PANE: CHAT TERMINAL */}
      <div
        id="left-pane"
        className="flex-shrink-0 flex flex-col border-r-4 border-retro-border h-[50vh] md:h-full"
        style={{ width: window.innerWidth >= 768 ? leftWidth : '100%' }}
      >
        <ChatWindow onResultsReady={() => setShowResults(true)} />
      </div>

      {/* Resizer Left */}
      <div
        className="hidden md:flex w-4 cursor-col-resize items-center justify-center -mx-4 z-20 group"
        onMouseDown={(e) => { setIsResizingLeft(true); e.preventDefault(); }}
      >
        <div className="h-24 w-2 bg-retro-border group-hover:bg-retro-accent rounded transition-colors shadow-sm"></div>
      </div>

      {/* CENTER PANE: MAP */}
      <div
        id="middle-pane"
        className="flex-1 relative overflow-hidden flex flex-col h-[50vh] md:h-full min-w-0"
        style={{ pointerEvents: (isResizingLeft || isResizingRight) ? 'none' : 'auto' }}
      >
        <MapViewer showResults={showResults} />
      </div>

      {/* Resizer Right */}
      <div
        className="hidden md:flex w-4 cursor-col-resize items-center justify-center -mx-4 z-20 group"
        onMouseDown={(e) => { setIsResizingRight(true); e.preventDefault(); }}
      >
        <div className="h-24 w-2 bg-retro-border group-hover:bg-retro-accent rounded transition-colors shadow-sm"></div>
      </div>

      {/* Right Pane */}
      <div
        id="right-pane"
        className="flex-shrink-0 pixel-shadow border-4 border-retro-border bg-retro-panel relative transition-[width] duration-0 flex flex-col h-auto md:h-full"
        style={{ width: window.innerWidth >= 768 ? rightWidth : '100%' }}
      >
        <AudioMixer />
      </div>
    </div>
  );
}

export default App;
