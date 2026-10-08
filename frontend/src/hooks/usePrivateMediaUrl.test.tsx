import { act, render, renderHook, waitFor } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axiosPrivate } from "../api/axios";
import { usePrivateMediaUrl } from "./usePrivateMediaUrl";

vi.mock("../api/axios", () => ({
    axiosPrivate: { get: vi.fn() },
}));

describe("usePrivateMediaUrl", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("downloads media with the authenticated client and releases its blob URL", async () => {
        const blobUrl = "blob:resident-evidence";
        const revokeObjectURL = vi.fn();
        vi.stubGlobal("URL", {
            createObjectURL: vi.fn(() => blobUrl),
            revokeObjectURL,
        });
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({ data: new Blob(["image"]) });

        const { result, unmount } = renderHook(() =>
            usePrivateMediaUrl("auth/resident/7/media/philsys_id_photo/"),
        );

        await waitFor(() => expect(result.current.url).toBe(blobUrl));
        expect(axiosPrivate.get).toHaveBeenCalledWith(
            "auth/resident/7/media/philsys_id_photo/",
            expect.objectContaining({ responseType: "blob" }),
        );

        act(() => unmount());
        expect(revokeObjectURL).toHaveBeenCalledWith(blobUrl);
    });

    it("does not request a missing media path", () => {
        renderHook(() => usePrivateMediaUrl(null));

        expect(axiosPrivate.get).not.toHaveBeenCalled();
    });

    it("does not expose the previous resident URL during a path change", async () => {
        vi.stubGlobal("URL", {
            createObjectURL: vi.fn(() => "blob:first-resident"),
            revokeObjectURL: vi.fn(),
        });
        vi.mocked(axiosPrivate.get).mockResolvedValueOnce({
            data: new Blob(["first resident"]),
        });

        const snapshots: Array<{ path: string; url: string | null }> = [];
        function Probe({ path }: { path: string }) {
            const state = usePrivateMediaUrl(path);
            useLayoutEffect(() => {
                snapshots.push({ path, url: state.url });
            }, [path, state.url]);
            return null;
        }

        const { rerender } = render(<Probe path="first-resident" />);
        await waitFor(() => {
            expect(
                snapshots.some(
                    ({ path, url }) => path === "first-resident" && url === "blob:first-resident",
                ),
            ).toBe(true);
        });

        vi.mocked(axiosPrivate.get).mockReturnValueOnce(
            new Promise(() => {}) as never,
        );
        rerender(<Probe path="second-resident" />);

        const secondResidentSnapshots = snapshots.filter(
            ({ path }) => path === "second-resident",
        );
        expect(secondResidentSnapshots[0].url).toBeNull();
    });

    it("ignores a media response that arrives after its request was aborted", async () => {
        let resolveFirstRequest: (response: { data: Blob }) => void = () => {};
        const firstRequest = new Promise<{ data: Blob }>((resolve) => {
            resolveFirstRequest = resolve;
        });
        const createObjectURL = vi.fn(() => "blob:current-resident");
        vi.stubGlobal("URL", {
            createObjectURL,
            revokeObjectURL: vi.fn(),
        });
        vi.mocked(axiosPrivate.get)
            .mockReturnValueOnce(firstRequest as never)
            .mockResolvedValueOnce({ data: new Blob(["current resident"]) });

        const { result, rerender } = renderHook(
            ({ path }) => usePrivateMediaUrl(path),
            { initialProps: { path: "first-resident" } },
        );
        rerender({ path: "current-resident" });

        await waitFor(() => {
            expect(result.current.url).toBe("blob:current-resident");
        });
        await act(async () => {
            resolveFirstRequest({ data: new Blob(["late first resident"]) });
            await Promise.resolve();
        });

        expect(createObjectURL).toHaveBeenCalledTimes(1);
        expect(result.current.url).toBe("blob:current-resident");
    });
});
