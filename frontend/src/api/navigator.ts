import { axiosPrivate } from './axios';
import type { NavigatorQueryResponse } from '../components/navigator/types';

/**
 * Submits a resident public information query to the tenant-scoped navigator API.
 * Endpoint: /api/v1/public/navigator/query/
 */
export async function submitNavigatorQuery(query: string): Promise<NavigatorQueryResponse> {
    const response = await axiosPrivate.post<NavigatorQueryResponse>('/public/navigator/query/', {
        query: query.trim(),
    });
    return response.data;
}
