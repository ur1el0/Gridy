import {
    type CSSProperties,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'
import { useParams } from 'react-router-dom'
import { Volume2, VolumeX } from 'lucide-react'
import { axiosPublic } from '../../api/axios'
import './PublicQueueDisplay.css'

interface PublicQueueStatus {
    barangay_name: string
    primary_color: string
    current_ticket: string | null
    total_waiting: number
}

const POLL_INTERVAL_MS = 5000
const FALLBACK_BRAND_COLOR = '#123456'

function getReadableTextColor(hexColor: string): string {
    if (!/^#[\da-f]{6}$/i.test(hexColor)) {
        return '#ffffff'
    }

    const channels = [
        Number.parseInt(hexColor.slice(1, 3), 16),
        Number.parseInt(hexColor.slice(3, 5), 16),
        Number.parseInt(hexColor.slice(5, 7), 16),
    ].map((channel) => {
        const value = channel / 255
        return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4
    })

    const luminance =
        0.2126 * channels[0] +
        0.7152 * channels[1] +
        0.0722 * channels[2]

    return luminance > 0.18 ? '#0f172a' : '#ffffff'
}

export function PublicQueueDisplay() {
    const { barangayId } = useParams<{ barangayId: string }>()
    const [status, setStatus] = useState<PublicQueueStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [audioEnabled, setAudioEnabled] = useState(false)
    const [audioNotice, setAudioNotice] = useState('')

    const audioEnabledRef = useRef(false)
    const audioContextRef = useRef<AudioContext | null>(null)
    const previousTicketRef = useRef<string | null | undefined>(undefined)

    const playChime = useCallback(async () => {
        if (
            !audioEnabledRef.current ||
            typeof window.AudioContext === 'undefined'
        ) {
            return
        }

        try {
            const context =
                audioContextRef.current ?? new window.AudioContext()
            audioContextRef.current = context

            if (context.state === 'suspended') {
                await context.resume()
            }

            if (!audioEnabledRef.current) {
                return
            }

            const oscillator = context.createOscillator()
            const gain = context.createGain()
            const now = context.currentTime

            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(880, now)
            oscillator.frequency.setValueAtTime(1174.66, now + 0.12)

            gain.gain.setValueAtTime(0.0001, now)
            gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

            oscillator.connect(gain)
            gain.connect(context.destination)
            oscillator.start()
            oscillator.stop(now + 0.36)
        } catch {
            // Keep the visual and screen-reader announcement if audio is blocked.
        }
    }, [])

    const announceTicket = useCallback(
        (ticketNumber: string) => {
            if (!audioEnabledRef.current) {
                return
            }

            void playChime()

            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel()

                const announcement = new SpeechSynthesisUtterance(
                    `Now serving ticket ${ticketNumber}. Please proceed to the service counter.`,
                )
                announcement.lang = 'en-PH'
                announcement.rate = 0.95

                window.speechSynthesis.speak(announcement)
            }
        },
        [playChime],
    )

    useEffect(() => {
        const routeBarangayId = barangayId ?? ''

        setStatus(null)
        setError(null)
        setLoading(true)
        previousTicketRef.current = undefined

        if (!/^\d+$/.test(routeBarangayId)) {
            setLoading(false)
            setError('A valid barangay ID is required.')
            return
        }

        let active = true
        let nextPollTimer: number | undefined
        const controller = new AbortController()

        const pollQueue = async () => {
            try {
                const response = await axiosPublic.get<PublicQueueStatus>(
                    `/public/barangays/${routeBarangayId}/queue-status/`,
                    { signal: controller.signal },
                )

                if (!active) {
                    return
                }

                const nextStatus = response.data
                const previousTicket = previousTicketRef.current

                setStatus(nextStatus)
                setError(null)
                setLoading(false)

                if (
                    previousTicket !== undefined &&
                    nextStatus.current_ticket &&
                    nextStatus.current_ticket !== previousTicket
                ) {
                    announceTicket(nextStatus.current_ticket)
                }

                previousTicketRef.current = nextStatus.current_ticket
            } catch {
                if (!active) {
                    return
                }

                setLoading(false)
                setError('Queue status is temporarily unavailable. Retrying.')
            } finally {
                if (active) {
                    nextPollTimer = window.setTimeout(
                        () => void pollQueue(),
                        POLL_INTERVAL_MS,
                    )
                }
            }
        }

        void pollQueue()

        return () => {
            active = false
            controller.abort()

            if (nextPollTimer !== undefined) {
                window.clearTimeout(nextPollTimer)
            }

            audioEnabledRef.current = false

            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel()
            }

            void audioContextRef.current?.close().catch(() => undefined)
        }
    }, [barangayId, announceTicket])

    const toggleAudio = () => {
        if (audioEnabledRef.current) {
            audioEnabledRef.current = false
            setAudioEnabled(false)
            setAudioNotice('Sound announcements are off.')

            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel()
            }

            return
        }

        const supportsSpeech = 'speechSynthesis' in window
        const supportsChime = typeof window.AudioContext === 'function'

        if (!supportsSpeech && !supportsChime) {
            setAudioNotice(
                'This browser does not support speech or audio announcements.',
            )
            return
        }

        audioEnabledRef.current = true
        setAudioEnabled(true)

        if (supportsSpeech && supportsChime) {
            setAudioNotice('Spoken announcements and chime are on.')
        } else if (supportsSpeech) {
            setAudioNotice('Spoken announcements are on. Chime is unavailable.')
        } else {
            setAudioNotice('Chime is on. Spoken announcements are unavailable.')
        }

        if (supportsChime) {
            try {
                const context =
                    audioContextRef.current ?? new window.AudioContext()
                audioContextRef.current = context

                if (context.state === 'suspended') {
                    void context.resume().catch(() => {
                        setAudioNotice(
                            'The browser could not enable the chime.',
                        )
                    })
                }
            } catch {
                setAudioNotice('The browser could not enable the chime.')
            }
        }
    }

    const brandColor =
        status && /^#[\da-f]{6}$/i.test(status.primary_color)
            ? status.primary_color
            : FALLBACK_BRAND_COLOR

    const brandStyle = {
        '--queue-brand-color': brandColor,
        '--queue-brand-text-color': getReadableTextColor(brandColor),
    } as CSSProperties

    return (
        <main className="public-queue" style={brandStyle}>
            <header className="public-queue__header">
                <div>
                    <p className="public-queue__eyebrow">Public service queue</p>
                    <h1>{status?.barangay_name ?? 'Barangay Queue'}</h1>
                </div>

                <button
                    className="public-queue__audio-button"
                    type="button"
                    onClick={toggleAudio}
                    aria-pressed={audioEnabled}
                >
                    {audioEnabled ? (
                        <Volume2 aria-hidden="true" />
                    ) : (
                        <VolumeX aria-hidden="true" />
                    )}
                    {audioEnabled
                        ? 'Turn announcements off'
                        : 'Enable sound announcements'}
                </button>
            </header>

            {audioNotice && (
                <p className="public-queue__audio-notice" role="status">
                    {audioNotice}
                </p>
            )}

            <section className="public-queue__content">
                {loading && !status && (
                    <p className="public-queue__message" role="status">
                        Loading queue status…
                    </p>
                )}

                {!status && error && (
                    <p className="public-queue__message public-queue__message--error" role="alert">
                        {error}
                    </p>
                )}

                {status && (
                    <>
                        {error && (
                            <p
                                className="public-queue__message public-queue__message--error"
                                role="alert"
                            >
                                {error}
                            </p>
                        )}

                        <div className="public-queue__ticket-card">
                            <p className="public-queue__eyebrow">Now serving</p>
                            <p
                                className="public-queue__ticket"
                                aria-live="polite"
                                aria-atomic="true"
                            >
                                {status.current_ticket
                                    ? `Ticket ${status.current_ticket}`
                                    : 'No ticket is being called'}
                            </p>
                        </div>

                        <div className="public-queue__waiting-card">
                            <p className="public-queue__eyebrow">
                                Residents waiting
                            </p>
                            <strong>{status.total_waiting}</strong>
                        </div>
                    </>
                )}

                <p className="public-queue__refresh-note">
                    Queue status refreshes automatically every five seconds.
                </p>
            </section>
        </main>
    )
}