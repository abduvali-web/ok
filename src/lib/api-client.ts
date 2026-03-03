/**
 * Shared API client — replaces the repeated `fetch → .json() → toast` pattern
 * (~30 occurrences) with a single, typed helper.
 */

export type ApiResult<T = unknown> = {
    ok: true
    data: T
} | {
    ok: false
    error: string
    details?: string
}

/**
 * Typed wrapper around `fetch`.
 *
 * - Auto-sets `Content-Type: application/json` for non-GET requests.
 * - Parses the JSON body and returns `{ ok, data }` or `{ ok: false, error }`.
 *
 * @example
 * const result = await fetchApi<{ deletedCount: number }>('/api/admin/orders/delete', {
 *   method: 'DELETE',
 *   body: { orderIds: ['a', 'b'] },
 * })
 * if (result.ok) {
 *   toast.success(`Deleted ${result.data.deletedCount}`)
 * } else {
 *   toast.error(result.error)
 * }
 */
export async function fetchApi<T = unknown>(
    url: string,
    options?: {
        method?: string
        body?: unknown
        headers?: Record<string, string>
    },
): Promise<ApiResult<T>> {
    const { method = 'GET', body, headers = {} } = options ?? {}

    const isBodyMethod = method !== 'GET' && method !== 'HEAD'
    const fetchHeaders: Record<string, string> = { ...headers }
    if (isBodyMethod && !fetchHeaders['Content-Type']) {
        fetchHeaders['Content-Type'] = 'application/json'
    }

    try {
        const response = await fetch(url, {
            method,
            headers: fetchHeaders,
            ...(isBodyMethod && body !== undefined ? { body: JSON.stringify(body) } : {}),
        })

        const data = await response.json().catch(() => null)

        if (response.ok) {
            return { ok: true, data: data as T }
        }

        return {
            ok: false,
            error: (data && (data as Record<string, string>).error) || `Ошибка запроса (${response.status})`,
            details: (data && (data as Record<string, string>).details) || undefined,
        }
    } catch {
        return { ok: false, error: 'Ошибка соединения с сервером' }
    }
}
