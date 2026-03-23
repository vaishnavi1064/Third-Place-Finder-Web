import { Header } from '../components/Header';
import { ChatBox } from '../components/ChatBox';
import { MapWindow } from '../components/MapWindow';
import { AudioMixer } from '../components/AudioMixer';
import { PomodoroTimer } from '../components/PomodoroTimer';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export function MainLayout() {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <Header />

      {/* Main Content with Resizable Panels */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Left Column - Chat */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full border-r border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50">
              <ChatBox />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-violet-500/30 transition-colors" />

          {/* Middle Column - Map */}
          <Panel defaultSize={60}>
            <div className="h-full">
              <MapWindow />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-200/50 dark:border-slate-700/50 hover:bg-violet-500/30 transition-colors" />

          {/* Right Column - Audio Mixer & Timer */}
          <Panel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full flex flex-col overflow-hidden border-l border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50">
              <div className="flex-shrink-0">
                <AudioMixer />
              </div>
              <div className="flex-1 overflow-auto">
                <PomodoroTimer />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
