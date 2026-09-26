import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { axiosPublic } from '../../api/axios'
import { PublicQueueDisplay } from './PublicQueueDisplay'

vi.mock('../../api/axios', () => ({
    axiosPublic: {
        get: vi.fn(),
    },
}))

const mockedGet = vi.mocked(axiosPublic.get)

function renderPublicQueue(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route
                    path="/public/queue/:barangayId"
                    element={<PublicQueueDisplay />}
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('PublicQueueDisplay', () => {
    beforeEach(() => {
        mockedGet.mockReset()
    })

    afterEach(() => {
        cleanup()
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })
    it('loads and displays queue status for the barangay in the URL', async () => {
        mockedGet.mockResolvedValue({
            data: {
                barangay_name: 'Barangay Cotta',
                primary_color: '#1D4ED8',
                current_ticket: 'A-104',
                total_waiting: 12,
            },
        } as never)

        renderPublicQueue('/public/queue/12')

        expect(await screen.findByText('Ticket A-104')).toBeInTheDocument()
        expect(screen.getByText('Barangay Cotta')).toBeInTheDocument()
        expect(screen.getByText('12')).toBeInTheDocument()
        expect(mockedGet.mock.calls[0]?.[0]).toBe(
            '/public/barangays/12/queue-status/',
        )
    })

    it('does not call the API for a non-numeric barangay ID', async () => {
        renderPublicQueue('/public/queue/not-an-id')

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'A valid barangay ID is required.',
        )
        expect(mockedGet).not.toHaveBeenCalled()
    })

        it('announces a changed ticket only after sound is enabled', async () => {
        const speech = {
            cancel: vi.fn(),
            speak: vi.fn(),
        }

        vi.stubGlobal('speechSynthesis', speech)
        vi.stubGlobal(
            'SpeechSynthesisUtterance',
            class {
                lang = ''
                rate = 1
                text: string

                constructor(text: string) {
                    this.text = text
                }
            },
        )
        vi.useFakeTimers()

        mockedGet
            .mockResolvedValueOnce({
                data: {
                    barangay_name: 'Barangay Cotta',
                    primary_color: '#1D4ED8',
                    current_ticket: 'A-104',
                    total_waiting: 12,
                },
            } as never)
            .mockResolvedValueOnce({
                data: {
                    barangay_name: 'Barangay Cotta',
                    primary_color: '#1D4ED8',
                    current_ticket: 'A-105',
                    total_waiting: 11,
                },
            } as never)

        renderPublicQueue('/public/queue/12')

        await act(async () => {
            await Promise.resolve()
            await Promise.resolve()
        })

        expect(screen.getByText('Ticket A-104')).toBeInTheDocument()
        expect(speech.speak).not.toHaveBeenCalled()

        fireEvent.click(
            screen.getByRole('button', { name: 'Enable sound announcements' }),
        )

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000)
        })

        expect(screen.getByText('Ticket A-105')).toBeInTheDocument()
        expect(speech.speak).toHaveBeenCalledTimes(1)

        const utterance = speech.speak.mock.calls[0]?.[0] as
            | { text?: string }
            | undefined
        expect(utterance?.text).toContain('A-105')
    })
})