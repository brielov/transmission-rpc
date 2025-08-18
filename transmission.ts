import camelcaseKeys from "camelcase-keys";
import type {
  AddTorrentArgs,
  AddTorrentResponse,
  FreeSpaceResponse,
  GetSessionResponse,
  GetTorrentArgs,
  GetTorrentResponse,
  ID,
  PortTestResponse,
  SessionStatsResponse,
  Torrent,
  TorrentSetArgs,
  TransmissionClientConfig,
} from "./types.ts";

/**
 * Represents a successful RPC response.
 * @template T - The type of the `arguments` field.
 */
interface RPCSuccess<T> {
  result: "success";
  arguments: T;
}

/**
 * Represents a failed RPC response.
 */
interface RPCFailure {
  // Transmission uses a string for non-success, e.g. "invalid request"
  result: string;
}

/**
 * Represents an RPC response, which can be either successful or failed.
 * @template T - The type of the `arguments` field in case of success.
 */
type RPCResponse<T> = RPCSuccess<T> | RPCFailure;

/**
 * Extended AbortSignal interface that includes our custom timeout ID property.
 */
interface ExtendedAbortSignal extends AbortSignal {
  _timeoutId?: number;
}

/**
 * A client for interacting with the Transmission RPC API.
 */
export class TransmissionClient {
  #url: URL;
  #sessionId: string | null = null;
  #requestTimeoutMs: number;

  /**
   * Gets the configured URL for the Transmission RPC endpoint.
   */
  get url(): URL {
    return this.#url;
  }

  /**
   * Gets the configured username for authentication.
   */
  get username(): string {
    return this.#url.username;
  }

  /**
   * Gets the configured password for authentication.
   */
  get password(): string {
    return this.#url.password;
  }

  /**
   * Gets the configured request timeout in milliseconds.
   */
  get requestTimeoutMs(): number {
    return this.#requestTimeoutMs;
  }

  /**
   * Creates a new TransmissionClient instance.
   * @param config - Configuration for the Transmission RPC server. Can be:
   *   - A string URL (e.g., "http://localhost:9091")
   *   - A URL object
   *   - A configuration object with host, port, ssl, username, password, and timeoutMs
   */
  constructor(config: TransmissionClientConfig) {
    const { url, timeoutMs } = this.parseConfig(config);

    this.#url = url;
    this.#requestTimeoutMs = timeoutMs;
  }

  /**
   * Parses the configuration input and returns normalized values.
   * @param config - The configuration input
   * @returns Normalized configuration values
   */
  private parseConfig(config: TransmissionClientConfig): {
    url: URL;
    timeoutMs: number;
  } {
    let url: URL;
    let timeoutMs = 10_000;

    if (typeof config === "string") {
      // Handle string URL
      url = new URL("/transmission/rpc", config);
    } else if (config instanceof URL) {
      // Handle URL object
      url = new URL("/transmission/rpc", config);
    } else {
      // Handle configuration object
      const protocol = config.ssl ? "https" : "http";
      const auth = config.username && config.password
        ? `${config.username}:${config.password}@`
        : "";

      url = new URL(
        `/transmission/rpc`,
        `${protocol}://${auth}${config.host}:${config.port}`,
      );
      timeoutMs = config.timeoutMs ?? 10_000;
    }

    return { url, timeoutMs };
  }

  /**
   * Encodes a string to base64 across runtimes (Deno/Node/Bun/Browser/RN).
   */
  private toBase64(input: string): string {
    // Deno/Browser/Bun typically provide btoa
    if (typeof btoa === "function") {
      return btoa(input);
    }
    // Node provides Buffer
    // deno-lint-ignore no-explicit-any
    const maybeBuffer: any =
      (globalThis as unknown as { Buffer?: unknown }).Buffer;
    if (maybeBuffer && typeof maybeBuffer.from === "function") {
      return maybeBuffer.from(input, "utf-8").toString("base64");
    }
    throw new Error(
      "Base64 encoding is not available in this environment. Please polyfill `btoa` or `Buffer`.",
    );
  }

  /**
   * Creates an AbortSignal that will abort after the specified timeout.
   * Falls back to a custom implementation if AbortSignal.timeout is not available.
   * @param timeoutMs - The timeout in milliseconds.
   * @returns An AbortSignal that will abort after the timeout.
   */
  private createTimeoutSignal(timeoutMs: number): AbortSignal {
    // Check if AbortSignal.timeout is available (modern browsers/environments)
    if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
      return AbortSignal.timeout(timeoutMs);
    }

    // Fallback for platforms that don't support AbortSignal.timeout (e.g., React Native)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Store the timeout ID on the signal so we can clear it if needed
    (controller.signal as ExtendedAbortSignal)._timeoutId = timeoutId;

    return controller.signal;
  }

  /**
   * Cleans up a timeout signal if it was created with the fallback implementation.
   * @param signal - The AbortSignal to clean up.
   */
  private cleanupTimeoutSignal(signal: AbortSignal): void {
    // Only clean up if it's our custom fallback implementation
    const extendedSignal = signal as ExtendedAbortSignal;
    if (extendedSignal._timeoutId) {
      clearTimeout(extendedSignal._timeoutId);
    }
  }

  /**
   * Generates the Basic Auth header if credentials are provided.
   * @returns The Base64-encoded Basic Auth header, or `undefined` if no credentials are provided.
   */
  private getAuthHeader(): string | undefined {
    const { username, password } = this;
    if (username || password) {
      // Only generate the header if either username or password is non-empty
      const encoded = this.toBase64(`${username}:${password}`);
      return `Basic ${encoded}`;
    }
    return undefined;
  }

  /**
   * Sends an RPC request to the Transmission server.
   * @template T - The type of the response arguments.
   * @param method - The RPC method to call.
   * @param args - Optional arguments for the RPC method.
   * @returns A promise resolving to the response arguments.
   * @throws {RPCError} If the RPC method returns an error.
   * @throws {Error} If the request fails or times out.
   */
  private async rpc<T>(
    method: string,
    // deno-lint-ignore no-explicit-any
    args?: { [key: string]: any },
    retryCount: number = 0,
  ): Promise<RPCSuccess<T>["arguments"]> {
    const headers = new Headers();

    const authHeader = this.getAuthHeader();
    if (authHeader) {
      headers.set("authorization", authHeader);
    }

    if (this.#sessionId) {
      headers.set("x-transmission-session-id", this.#sessionId);
    }

    headers.set("content-type", "application/json");
    headers.set("accept", "application/json");

    // Create a timeout signal that works across all platforms
    const timeoutSignal = this.createTimeoutSignal(this.#requestTimeoutMs);

    let response: Response;
    try {
      response = await fetch(this.url, {
        body: JSON.stringify({ method, arguments: args }),
        headers,
        method: "POST",
        signal: timeoutSignal,
      });
    } catch (error) {
      // Clean up the timeout signal if it was our custom implementation
      this.cleanupTimeoutSignal(timeoutSignal);
      throw error;
    }

    // Clean up the timeout signal since the request completed successfully
    this.cleanupTimeoutSignal(timeoutSignal);

    if (
      response.status === 409 ||
      response.headers.has("X-Transmission-Session-Id")
    ) {
      const newSessionId = response.headers.get("X-Transmission-Session-Id");
      if (newSessionId) {
        this.#sessionId = newSessionId;
      }
      if (response.status === 409) {
        if (retryCount >= 2) {
          throw new Error(
            "Failed to negotiate Transmission session after multiple attempts (409).",
          );
        }
        return this.rpc(method, args, retryCount + 1);
      }
    }

    if (!response.ok) {
      throw new Error(
        `API request failed: [${response.status}] ${response.statusText}`,
      );
    }

    const json: RPCResponse<unknown> = await response.json();

    if (json.result !== "success") {
      throw new Error(json.result);
    }

    return camelcaseKeys(
      (json as RPCSuccess<unknown>).arguments as Record<string, unknown>,
      {
        deep: true,
      },
    ) as T;
  }

  /**
   * Retrieves the current session statistics and settings.
   * @returns A promise resolving to the session data.
   */
  public session(): Promise<GetSessionResponse> {
    return this.rpc<GetSessionResponse>("session-get");
  }

  /**
   * Retrieves information about one or more torrents.
   * @template K - The keys of the `Torrent` fields to retrieve.
   * @param args - Optional arguments to filter and select torrent fields.
   * @returns A promise resolving to the list of torrents.
   */
  public torrents<K extends keyof Torrent>(
    args?: GetTorrentArgs<K>,
  ): Promise<GetTorrentResponse<K>> {
    return this.rpc<GetTorrentResponse<K>>("torrent-get", args);
  }

  /**
   * Adds a new torrent to the session.
   * @param args - Arguments specifying the torrent to add.
   * @returns A promise resolving to the added torrent's details.
   */
  public add(args: AddTorrentArgs): Promise<AddTorrentResponse> {
    const {
      downloadDir,
      peerLimit,
      filesWanted,
      filesUnwanted,
      priorityHigh,
      priorityLow,
      priorityNormal,
      ...rest
    } = args;

    return this.rpc<AddTorrentResponse>("torrent-add", {
      ...rest,
      "download-dir": downloadDir,
      "peer-limit": peerLimit,
      "files-wanted": filesWanted,
      "files-unwanted": filesUnwanted,
      "priority-high": priorityHigh,
      "priority-low": priorityLow,
      "priority-normal": priorityNormal,
    });
  }

  /**
   * Removes one or more torrents from the session.
   * @param ids - The IDs of the torrents to remove.
   * @param deleteLocalData - Whether to delete the torrent's data.
   * @returns A promise resolving when the operation is complete.
   */
  public remove(ids: ID, deleteLocalData?: boolean): Promise<void> {
    return this.rpc<void>("torrent-remove", {
      ids,
      "delete-local-data": deleteLocalData,
    });
  }

  /**
   * Moves one or more torrents to a new location.
   * @param id - The ID of the torrent to move.
   * @param location - The new location for the torrent's content.
   * @param move - Whether to move the data from the previous location.
   * @returns A promise resolving when the operation is complete.
   */
  public move(id: ID, location: string, move?: boolean): Promise<void> {
    return this.rpc<void>("torrent-set-location", { ids: id, location, move });
  }

  /**
   * Starts one or more torrents.
   * @param id - The ID of the torrent to start.
   * @returns A promise resolving when the operation is complete.
   */
  public start(id: ID): Promise<void> {
    return this.rpc<void>("torrent-start", { ids: id });
  }

  /**
   * Stops one or more torrents.
   * @param id - The ID of the torrent to stop.
   * @returns A promise resolving when the operation is complete.
   */
  public stop(id: ID): Promise<void> {
    return this.rpc<void>("torrent-stop", { ids: id });
  }

  /**
   * Starts one or more torrents immediately, bypassing the queue.
   * @param id - The ID of the torrent to start.
   * @returns A promise resolving when the operation is complete.
   */
  public startNow(id: ID): Promise<void> {
    return this.rpc<void>("torrent-start-now", { ids: id });
  }

  /**
   * Verifies the data of one or more torrents.
   * @param id - The ID of the torrent to verify.
   * @returns A promise resolving when the operation is complete.
   */
  public verify(id: ID): Promise<void> {
    return this.rpc<void>("torrent-verify", { ids: id });
  }

  /**
   * Reannounces one or more torrents to their trackers.
   * @param id - The ID of the torrent to reannounce.
   * @returns A promise resolving when the operation is complete.
   */
  public reannounce(id: ID): Promise<void> {
    return this.rpc<void>("torrent-reannounce", { ids: id });
  }

  /**
   * Moves one or more torrents up in the queue.
   * @param id - The ID of the torrent to move.
   * @returns A promise resolving when the operation is complete.
   */
  public moveUp(id: ID): Promise<void> {
    return this.rpc<void>("queue-move-up", { ids: id });
  }

  /**
   * Moves one or more torrents down in the queue.
   * @param id - The ID of the torrent to move.
   * @returns A promise resolving when the operation is complete.
   */
  public moveDown(id: ID): Promise<void> {
    return this.rpc<void>("queue-move-down", { ids: id });
  }

  /**
   * Moves one or more torrents to the top of the queue.
   * @param id - The ID of the torrent to move.
   * @returns A promise resolving when the operation is complete.
   */
  public moveTop(id: ID): Promise<void> {
    return this.rpc<void>("queue-move-top", { ids: id });
  }

  /**
   * Moves one or more torrents to the bottom of the queue.
   * @param id - The ID of the torrent to move.
   * @returns A promise resolving when the operation is complete.
   */
  public moveBottom(id: ID): Promise<void> {
    return this.rpc<void>("queue-move-bottom", { ids: id });
  }

  /**
   * Retrieves the amount of free space in a directory.
   * @param path - The directory path to check.
   * @returns A promise resolving to the free space information.
   */
  public freeSpace(path: string): Promise<FreeSpaceResponse> {
    return this.rpc<FreeSpaceResponse>("free-space", { path });
  }

  /**
   * Sets properties for one or more torrents.
   * @param args - Arguments specifying the properties to set.
   * @returns A promise resolving when the operation is complete.
   */
  public set(args: TorrentSetArgs): Promise<void> {
    const {
      bandwidthPriority,
      downloadLimit,
      downloadLimited,
      filesUnwanted,
      filesWanted,
      group,
      honorsSessionLimits,
      labels,
      location,
      peerLimit,
      priorityHigh,
      priorityLow,
      priorityNormal,
      queuePosition,
      seedIdleLimit,
      seedIdleMode,
      seedRatioLimit,
      seedRatioMode,
      sequentialDownload,
      trackerList,
      uploadLimit,
      uploadLimited,
      ...rest
    } = args;

    return this.rpc<void>("torrent-set", {
      ...rest,
      "bandwidth-priority": bandwidthPriority,
      "download-limit": downloadLimit,
      "download-limited": downloadLimited,
      "files-unwanted": filesUnwanted,
      "files-wanted": filesWanted,
      group,
      "honors-session-limits": honorsSessionLimits,
      labels,
      location,
      "peer-limit": peerLimit,
      "priority-high": priorityHigh,
      "priority-low": priorityLow,
      "priority-normal": priorityNormal,
      "queue-position": queuePosition,
      "seed-idle-limit": seedIdleLimit,
      "seed-idle-mode": seedIdleMode,
      "seed-ratio-limit": seedRatioLimit,
      "seed-ratio-mode": seedRatioMode,
      "sequential-download": sequentialDownload,
      "tracker-list": trackerList,
      "upload-limit": uploadLimit,
      "upload-limited": uploadLimited,
    });
  }

  /**
   * Retrieves session statistics (e.g., upload/download speeds).
   * @returns A promise resolving to the session statistics.
   */
  public stats(): Promise<SessionStatsResponse> {
    return this.rpc<SessionStatsResponse>("session-stats");
  }

  /**
   * Closes the Transmission session.
   * @returns A promise resolving when the operation is complete.
   */
  public closeSession(): Promise<void> {
    return this.rpc<void>("session-close");
  }

  /**
   * Tests whether the incoming peer port is accessible.
   * @returns A promise resolving to the port test result.
   */
  public testPort(): Promise<PortTestResponse> {
    return this.rpc<PortTestResponse>("port-test");
  }

  /**
   * Updates the blocklist (if enabled).
   * @returns A promise resolving when the operation is complete.
   */
  public updateBlocklist(): Promise<void> {
    return this.rpc<void>("blocklist-update");
  }

  /**
   * Renames a file or directory within a torrent.
   * @param id - The ID of the torrent.
   * @param path - The current path of the file or directory.
   * @param name - The new name for the file or directory.
   * @returns A promise resolving when the operation is complete.
   */
  public renamePath(id: ID, path: string, name: string): Promise<void> {
    return this.rpc<void>("torrent-rename-path", { ids: id, path, name });
  }
}
