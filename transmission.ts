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
  result: "error";
  error: string;
  errorCode: number;
}

/**
 * Represents an RPC response, which can be either successful or failed.
 * @template T - The type of the `arguments` field in case of success.
 */
type RPCResponse<T> = RPCSuccess<T> | RPCFailure;

/**
 * Represents an error returned by the Transmission RPC API.
 */
export class RPCError extends Error {
  /**
   * Creates a new RPCError instance.
   * @param message - The error message.
   * @param code - The error code.
   */
  constructor(
    message: string,
    public readonly code: number,
  ) {
    super(message);
  }
}

/**
 * A client for interacting with the Transmission RPC API.
 */
export class TransmissionClient {
  private readonly url: URL;
  private readonly username: string;
  private readonly password: string;

  private sessionId: string | null = null;

  /**
   * Creates a new TransmissionClient instance.
   * @param baseUrl - The base URL of the Transmission RPC server.
   * @param credentials - Optional credentials for authentication.
   */
  constructor(
    baseUrl: string | URL,
    credentials?: { username?: string; password?: string },
  ) {
    const url = new URL("/transmission/rpc", baseUrl);

    // Use credentials from URL or fallback to provided ones
    this.username = credentials?.username ?? url.username;
    this.password = credentials?.password ?? url.password;

    // Remove credentials from URL
    url.username = "";
    url.password = "";

    this.url = url;
  }

  /**
   * Generates the Basic Auth header if credentials are provided.
   * @returns The Base64-encoded Basic Auth header, or `undefined` if no credentials are provided.
   */
  private getAuthHeader(): string | undefined {
    const { username, password } = this;
    if (username || password) {
      // Only generate the header if either username or password is non-empty
      const encoded = btoa(`${username}:${password}`);
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
  ): Promise<RPCSuccess<T>["arguments"]> {
    const headers = new Headers();

    const authHeader = this.getAuthHeader();
    if (authHeader) {
      headers.set("authorization", authHeader);
    }

    if (this.sessionId) {
      headers.set("x-transmission-session-id", this.sessionId);
    }

    const response = await fetch(this.url, {
      body: JSON.stringify({ method, arguments: args }),
      headers,
      method: "POST",
      signal: AbortSignal.timeout(10_000), // Abort after 10 seconds
    });

    if (
      response.status === 409 ||
      response.headers.has("X-Transmission-Session-Id")
    ) {
      const newSessionId = response.headers.get("X-Transmission-Session-Id");
      if (newSessionId) {
        this.sessionId = newSessionId;
      }
      if (response.status === 409) {
        return this.rpc(method, args);
      }
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const json: RPCResponse<unknown> = await response.json();

    if (json.result === "error") {
      throw new RPCError(json.error, json.errorCode);
    }

    return camelcaseKeys(json.arguments as Record<string, unknown>, {
      deep: true,
    }) as T;
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
  public get<K extends keyof Torrent>(
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
