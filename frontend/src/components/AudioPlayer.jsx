import { useState, useRef, useEffect } from 'react';

const AudioPlayer = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef(null);
    const progressBarRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            setDuration(audio.duration);
            setCurrentTime(audio.currentTime);
        };

        const setAudioTime = () => setCurrentTime(audio.currentTime);

        // Initial load
        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
        };
    }, []);

    const togglePlayPause = () => {
        const prevValue = isPlaying;
        setIsPlaying(!prevValue);
        if (!prevValue) {
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
    };

    const handleProgressChange = (e) => {
        const newTime = e.target.value;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        audioRef.current.volume = newVolume;
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (isMuted) {
            audioRef.current.volume = volume || 0.5;
            setIsMuted(false);
        } else {
            audioRef.current.volume = 0;
            setIsMuted(true);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-inner">
            <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} />

            <div className="flex flex-col gap-2">
                {/* Seek Bar */}
                <div className="flex items-center gap-2 group">
                    <span className="text-[10px] font-medium text-outline-variant w-8">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        ref={progressBarRef}
                        defaultValue="0"
                        value={currentTime}
                        max={duration || 0}
                        onChange={handleProgressChange}
                        className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <span className="text-[10px] font-medium text-outline-variant w-8">{formatTime(duration)}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={togglePlayPause}
                            aria-label={isPlaying ? "Pause" : "Play"}
                            className="w-8 h-8 flex items-center justify-center bg-primary-600 text-on-primary rounded-full hover:bg-primary-700 transition-all active:scale-90 shadow-sm"
                        >
                            {isPlaying ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        <div className="flex items-center gap-2 group relative">
                            <button
                                onClick={toggleMute}
                                aria-label={isMuted ? "Unmute" : "Mute"}
                                className="text-outline-variant hover:text-primary-600 transition-colors"
                            >
                                {isMuted || volume === 0 ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    </svg>
                                )}
                            </button>

                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-16 h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </div>

                    <div className="text-[10px] text-outline-variant font-mono hidden sm:block">
                        MP3 AUDIO
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
