import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AudioPlayer from '../components/AudioPlayer';

describe('AudioPlayer Component', () => {
    const testSrc = 'test-audio.mp3';

    it('renders correctly with initial state', () => {
        render(<AudioPlayer src={testSrc} />);

        // Check for seeker labels (there are two: current and duration)
        const timeLabels = screen.getAllByText('0:00');
        expect(timeLabels.length).toBeGreaterThanOrEqual(1);

        // Check for play button
        expect(screen.getByRole('button', { name: /play/i })).toBeDefined();
    });

    it('toggles play/pause state when clicked', () => {
        // Mock HTMLMediaElement.prototype.play and pause
        window.HTMLMediaElement.prototype.play = vi.fn();
        window.HTMLMediaElement.prototype.pause = vi.fn();

        render(<AudioPlayer src={testSrc} />);

        const playButton = screen.getByRole('button', { name: /play/i });

        // Click to play
        fireEvent.click(playButton);
        expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();

        // After clicking, it should show pause label (if we updated the label)
        expect(screen.getByRole('button', { name: /pause/i })).toBeDefined();

        // Click to pause
        fireEvent.click(screen.getByRole('button', { name: /pause/i }));
        expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });

    it('toggles mute state when volume button is clicked', () => {
        render(<AudioPlayer src={testSrc} />);

        const muteButton = screen.getByRole('button', { name: /mute/i });
        fireEvent.click(muteButton);

        // Should now show unmute label
        expect(screen.getByRole('button', { name: /unmute/i })).toBeDefined();
    });
});
