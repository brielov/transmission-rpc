import camelcaseKeys from "camelcase-keys";
import type {
	AddTorrentResponse,
	AddTorrentArgs,
	GetSessionResponse,
	GetTorrentArgs,
	GetTorrentResponse,
	Torrent,
	IDS,
} from "./types";

interface RPCSuccess<T> {
	result: "success";
	arguments: T;
}

interface RPCFailure {
	result: "error";
	error: string;
	errorCode: number;
}

type RPCResponse<T> = RPCSuccess<T> | RPCFailure;

interface Credentials {
	username: string;
	password: string;
}

export class RPCError extends Error {
	constructor(
		message: string,
		public readonly code: number,
	) {
		super(message);
	}
}

export class TransmissionClient {
	private readonly url: URL;
	private sessionId: string | null = null;

	constructor(
		baseUrl: string,
		private readonly credentials?: Readonly<Credentials>,
	) {
		this.url = new URL("/transmission/rpc", baseUrl);
	}

	private getAuthHeader(): string | undefined {
		if (this.credentials) {
			const { username, password } = this.credentials;
			const encoded = Buffer.from(`${username}:${password}`).toString("base64");
			return `Basic ${encoded}`;
		}
		return undefined;
	}

	private async rpc<T>(
		method: string,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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

	public getSession() {
		return this.rpc<GetSessionResponse>("session-get");
	}

	public getTorrent<K extends keyof Torrent>(args?: GetTorrentArgs<K>) {
		return this.rpc<GetTorrentResponse<K>>("torrent-get", args);
	}

	public addTorrent(args: AddTorrentArgs) {
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

	public removeTorrent(ids: IDS, deleteLocalData?: boolean) {
		return this.rpc<void>("torrent-remove", {
			ids,
			"delete-local-data": deleteLocalData,
		});
	}

	public moveTorrent(ids: IDS, location: string, move?: boolean) {
		return this.rpc<void>("torrent-set-location", { ids, location, move });
	}

	public startTorrent(ids: IDS) {
		return this.rpc<void>("torrent-start", { ids });
	}

	public stopTorrent(ids: IDS) {
		return this.rpc<void>("torrent-stop", { ids });
	}

	public startTorrentNow(ids: IDS) {
		return this.rpc<void>("torrent-start-now", { ids });
	}

	public verifyTorrent() {}
	// public moveTorrentUp() {}
	// public moveTorrentDown() {}
	// public moveTorrentToTop() {}
	// public moveTorrentToBottom () {}
	// public checkFreeSpace() {}
	// public reannounceTorrent() {}
	// public setFilePriority() {}
	// public setWantedFiles() {}
}
