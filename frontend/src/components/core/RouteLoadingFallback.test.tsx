import { act, render, screen } from '@testing-library/react'
import { lazy, Suspense, type ComponentType } from 'react'
import { describe, expect, it } from 'vitest'
import { RouteLoadingFallback } from './RouteLoadingFallback'

describe('RouteLoadingFallback', () => {
    it('announces a pending route chunk until the page is ready', async () => {
        let finishLoading: (() => void) | undefined
        const LazyRoute = lazy(
            () => new Promise<{ default: ComponentType }>((resolve) => {
                finishLoading = () => resolve({ default: () => <p>Route ready</p> })
            }),
        )

        render(
            <Suspense fallback={<RouteLoadingFallback />}>
                <LazyRoute />
            </Suspense>,
        )

        expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
        expect(screen.getByText('Loading page…')).toBeInTheDocument()

        await act(async () => finishLoading?.())

        expect(await screen.findByText('Route ready')).toBeInTheDocument()
    })
})
