/**
 * Represents the status of a torrent.
 */
export enum TorrentStatus {
	/** Torrent is stopped. */
	Stopped = 0,
	/** Torrent is queued to verify local data. */
	QueuedToVerify = 1,
	/** Torrent is verifying local data. */
	Verifying = 2,
	/** Torrent is queued to download. */
	QueuedToDownload = 3,
	/** Torrent is downloading. */
	Downloading = 4,
	/** Torrent is queued to seed. */
	QueuedToSeed = 5,
	/** Torrent is seeding. */
	Seeding = 6,
}

/**
 * Represents a file in a torrent.
 */
export interface File {
	/** The number of bytes completed for this file. */
	bytesCompleted: number;
	/** The total size of the file in bytes. */
	length: number;
	/** The name of the file. */
	name: string;
	/** The index of the first piece that contains data for this file. */
	beginPiece: number;
	/** The index of the last piece that contains data for this file. */
	endPiece: number;
}

/**
 * Represents statistics for a file in a torrent.
 */
export interface FileStat {
	/** The number of bytes completed for this file. */
	bytesCompleted: number;
	/** Whether the file is marked as "wanted" for download. */
	wanted: boolean;
	/** The priority of the file (e.g., low, normal, high). */
	priority: number;
}

/**
 * Represents a tracker configured for a torrent.
 */
export interface Tracker {
	/** The announce URL of the tracker. */
	announce: string;
	/** The unique ID of the tracker. */
	id: number;
	/** The scrape URL of the tracker. */
	scrape: string;
	/** The name of the tracker site. */
	sitename: string;
	/** The tier of the tracker. */
	tier: number;
}

/**
 * Represents statistics and state information for a tracker.
 */
export interface TrackerStat {
	/** The unique ID of the tracker. */
	id: number;
	/** The current state of the tracker's announce process. */
	announceState: number;
	/** The number of times the torrent has been downloaded (as reported by the tracker). */
	downloadCount: number;
	/** Whether the tracker has been announced to. */
	hasAnnounced: boolean;
	/** Whether the tracker has been scraped. */
	hasScraped: boolean;
	/** Whether this tracker is a backup tracker. */
	isBackup: boolean;
	/** The number of peers reported by the tracker in the last announce. */
	lastAnnouncePeerCount: number;
	/** The result of the last announce. */
	lastAnnounceResult: string;
	/** The start time of the last announce. */
	lastAnnounceStartTime: number;
	/** Whether the last announce succeeded. */
	lastAnnounceSucceeded: boolean;
	/** The time of the last announce. */
	lastAnnounceTime: number;
	/** Whether the last announce timed out. */
	lastAnnounceTimedOut: boolean;
	/** The result of the last scrape. */
	lastScrapeResult: string;
	/** The start time of the last scrape. */
	lastScrapeStartTime: number;
	/** Whether the last scrape succeeded. */
	lastScrapeSucceeded: boolean;
	/** The time of the last scrape. */
	lastScrapeTime: number;
	/** Whether the last scrape timed out. */
	lastScrapeTimedOut: boolean;
	/** The number of leechers reported by the tracker. */
	leecherCount: number;
	/** The time of the next announce. */
	nextAnnounceTime: number;
	/** The time of the next scrape. */
	nextScrapeTime: number;
	/** The current state of the tracker's scrape process. */
	scrapeState: number;
	/** The number of seeders reported by the tracker. */
	seederCount: number;
}

/**
 * Represents statistics about where peers were discovered.
 */
export interface PeersFrom {
	/** Number of peers discovered from the cache. */
	fromCache: number;
	/** Number of peers discovered from the Distributed Hash Table (DHT). */
	fromDht: number;
	/** Number of peers discovered from incoming connections. */
	fromIncoming: number;
	/** Number of peers discovered from Local Peer Discovery (LPD). */
	fromLpd: number;
	/** Number of peers discovered from LibTorrent Extension Protocol (LTEP). */
	fromLtep: number;
	/** Number of peers discovered from Peer Exchange (PEX). */
	fromPex: number;
	/** Number of peers discovered from trackers. */
	fromTracker: number;
}

/**
 * Represents a peer connected to a torrent.
 */
export interface Peer {
	/** The IP address of the peer. */
	address: string;
	/** The name of the client software the peer is using. */
	clientName: string;
	/** Whether the client is choked (unable to request data from this peer). */
	clientIsChoked: boolean;
	/** Whether the client is interested in downloading from this peer. */
	clientIsInterested: boolean;
	/** A string of flags representing the peer's state (e.g., "D" for downloading, "U" for uploading). */
	flagStr: string;
	/** Whether the client is currently downloading from this peer. */
	isDownloadingFrom: boolean;
	/** Whether the connection to this peer is encrypted. */
	isEncrypted: boolean;
	/** Whether the peer initiated the connection (incoming connection). */
	isIncoming: boolean;
	/** Whether the client is currently uploading to this peer. */
	isUploadingTo: boolean;
	/** Whether the connection to this peer uses µTP (Micro Transport Protocol). */
	isUTP: boolean;
	/** Whether the peer is choked (unable to request data from the client). */
	peerIsChoked: boolean;
	/** Whether the peer is interested in downloading from the client. */
	peerIsInterested: boolean;
	/** The port number the peer is using. */
	port: number;
	/** The progress of the peer in downloading the torrent (0.0 to 1.0). */
	progress: number;
	/** The download rate from the peer to the client, in bytes per second (B/s). */
	rateToClient: number;
	/** The upload rate from the client to the peer, in bytes per second (B/s). */
	rateToPeer: number;
}

/**
 * Represents a torrent and its associated metadata and statistics.
 */
export interface Torrent {
	/** The last time the torrent was active (in Unix time). */
	activityDate: number;
	/** The date the torrent was added (in Unix time). */
	addedDate: number;
	/** An array of availability values for each piece of the torrent. */
	availability?: ReadonlyArray<number>;
	/** The bandwidth priority of the torrent (e.g., low, normal, high). */
	bandwidthPriority: number;
	/** The comment associated with the torrent. */
	comment?: string;
	/** The total amount of corrupt data downloaded for this torrent. */
	corruptEver: number;
	/** The creator of the torrent. */
	creator?: string;
	/** The date the torrent was created (in Unix time). */
	dateCreated: number;
	/** The amount of data available for download that is not yet downloaded. */
	desiredAvailable: number;
	/** The date the torrent finished downloading (in Unix time). */
	doneDate?: number;
	/** The directory where the torrent's files are being downloaded. */
	downloadDir: string;
	/** The total amount of data downloaded for this torrent. */
	downloadedEver: number;
	/** The download speed limit for the torrent (in bytes per second). */
	downloadLimit: number;
	/** Whether the download speed limit is enabled for the torrent. */
	downloadLimited: boolean;
	/** The last time the torrent's metadata was edited (in Unix time). */
	editDate?: number;
	/** The error code for the torrent (0 means no error). */
	error: number;
	/** A description of the error, if any. */
	errorString?: string;
	/** The estimated time remaining for the torrent to finish downloading (in seconds). */
	eta: number;
	/** The estimated time remaining for the torrent to finish downloading while idle (in seconds). */
	etaIdle: number;
	/** The number of files in the torrent. */
	fileCount: number;
	/** An array of objects representing each file in the torrent. */
	files?: ReadonlyArray<File>;
	/** An array of objects containing statistics for each file in the torrent. */
	fileStats?: ReadonlyArray<FileStat>;
	/** The group the torrent belongs to. */
	group?: string;
	/** The hash string of the torrent. */
	hashString: string;
	/** The amount of data that has been downloaded but not yet verified. */
	haveUnchecked: number;
	/** The amount of data that has been downloaded and verified. */
	haveValid: number;
	/** Whether the torrent honors session-wide speed limits. */
	honorsSessionLimits: boolean;
	/** The unique ID of the torrent. */
	id: number;
	/** Whether the torrent has finished downloading. */
	isFinished: boolean;
	/** Whether the torrent is private (i.e., does not allow peer exchange). */
	isPrivate: boolean;
	/** Whether the torrent is stalled (not downloading or uploading). */
	isStalled: boolean;
	/** An array of labels associated with the torrent. */
	labels?: ReadonlyArray<string>;
	/** The amount of data left to download until the torrent is complete. */
	leftUntilDone: number;
	/** The magnet link for the torrent. */
	magnetLink?: string;
	/** The time when the torrent can be manually announced to trackers (in Unix time). */
	manualAnnounceTime?: number;
	/** The maximum number of connected peers for the torrent. */
	maxConnectedPeers: number;
	/** The percentage of metadata that has been downloaded (0.0 to 1.0). */
	metadataPercentComplete: number;
	/** The name of the torrent. */
	name: string;
	/** The maximum number of peers the torrent can connect to. */
	peerLimit: number;
	/** An array of objects representing peers connected to the torrent. */
	peers?: ReadonlyArray<Peer>;
	/** The number of peers currently connected to the torrent. */
	peersConnected: number;
	/** An object containing statistics about where peers were discovered. */
	peersFrom?: PeersFrom;
	/** The number of peers downloading from the torrent. */
	peersGettingFromUs: number;
	/** The number of peers uploading to the torrent. */
	peersSendingToUs: number;
	/** The percentage of the torrent that has been downloaded (0.0 to 1.0). */
	percentComplete: number;
	/** The percentage of the torrent that has been downloaded (0.0 to 1.0). */
	percentDone: number;
	/** A string representing the pieces of the torrent that have been downloaded. */
	pieces?: string;
	/** The number of pieces in the torrent. */
	pieceCount: number;
	/** The size of each piece in the torrent (in bytes). */
	pieceSize: number;
	/** An array of priorities for each file in the torrent. */
	priorities?: ReadonlyArray<number>;
	/** The primary MIME type of the torrent's files. */
	primaryMimeType?: string;
	/** The position of the torrent in the download queue. */
	queuePosition: number;
	/** The download rate of the torrent (in bytes per second). */
	rateDownload: number;
	/** The upload rate of the torrent (in bytes per second). */
	rateUpload: number;
	/** The progress of the torrent's recheck process (0.0 to 1.0). */
	recheckProgress: number;
	/** The total time spent downloading the torrent (in seconds). */
	secondsDownloading: number;
	/** The total time spent seeding the torrent (in seconds). */
	secondsSeeding: number;
	/** The idle time limit for seeding the torrent (in seconds). */
	seedIdleLimit: number;
	/** The seeding idle mode (0 = unlimited, 1 = limited by seedIdleLimit). */
	seedIdleMode: number;
	/** The seeding ratio limit for the torrent. */
	seedRatioLimit: number;
	/** The seeding ratio mode (0 = unlimited, 1 = limited by seedRatioLimit). */
	seedRatioMode: number;
	/** Whether the torrent is being downloaded sequentially. */
	sequentialDownload: boolean;
	/** The size of the torrent when it is complete (in bytes). */
	sizeWhenDone: number;
	/** The date the torrent was started (in Unix time). */
	startDate?: number;
	/** The current status of the torrent (e.g., downloading, seeding, stopped). */
	status: TorrentStatus;
	/** An array of objects representing the trackers for the torrent. */
	trackers?: ReadonlyArray<Tracker>;
	/** A string of announce URLs, one per line, with a blank line between tiers. */
	trackerList?: string;
	/** An array of objects containing statistics for each tracker. */
	trackerStats?: ReadonlyArray<TrackerStat>;
	/** The total size of the torrent's files (in bytes). */
	totalSize: number;
	/** The path to the torrent file. */
	torrentFile?: string;
	/** The total amount of data uploaded for this torrent. */
	uploadedEver: number;
	/** The upload speed limit for the torrent (in bytes per second). */
	uploadLimit: number;
	/** Whether the upload speed limit is enabled for the torrent. */
	uploadLimited: boolean;
	/** The upload ratio of the torrent (uploadedEver / downloadedEver). */
	uploadRatio: number;
	/** An array of booleans indicating whether each file is wanted for download. */
	wanted?: ReadonlyArray<boolean>;
	/** An array of webseed URLs for the torrent. */
	webseeds?: ReadonlyArray<string>;
	/** The number of webseeds currently uploading to the torrent. */
	webseedsSendingToUs: number;
}

/**
 * Represents a removed torrent.
 */
export interface RemovedTorrent {
	/** The unique ID of the torrent. */
	id: number;
	/** The name of the torrent. */
	name: string;
	/** The date the torrent was deleted. */
	dateDeleted: string;
}

/**
 * Represents the response from a session stats request.
 */
export interface SessionStatsResponse {
	/** Total number of active torrents. */
	activeTorrentCount: number;
	/** Total download speed (bytes per second). */
	downloadSpeed: number;
	/** Total number of paused torrents. */
	pausedTorrentCount: number;
	/** Total upload speed (bytes per second). */
	uploadSpeed: number;
	/** Cumulative number of torrents ever added. */
	torrentCount: number;
	/** Cumulative data downloaded (bytes). */
	downloadedBytes: number;
	/** Cumulative data uploaded (bytes). */
	uploadedBytes: number;
	/** Total time spent downloading (seconds). */
	secondsDownloading: number;
	/** Total time spent seeding (seconds). */
	secondsSeeding: number;
	/** Total number of sessions since the server started. */
	sessionCount: number;
	/** Ratio of uploadedBytes to downloadedBytes. */
	uploadRatio: number;
}

/**
 * Represents the response from a port test request.
 */
export interface PortTestResponse {
	/** Whether the port is open and accessible. */
	portIsOpen: boolean;
}

/**
 * Represents the response from a get session request.
 */
export interface GetSessionResponse {
	/** Maximum download speed (in KB/s). */
	altSpeedDown: number;
	/** Maximum upload speed (in KB/s). */
	altSpeedUp: number;
	/** Whether the alternate speed limits are enabled. */
	altSpeedEnabled: boolean;
	/** Time when the alternate speed limits are scheduled to end. */
	altSpeedTimeEnd: number;
	/** Whether the alternate speed limits are scheduled. */
	altSpeedTimeEnabled: boolean;
	/** Time when the alternate speed limits are scheduled to start. */
	altSpeedTimeBegin: number;
	/** Days of the week when the alternate speed limits are active. */
	altSpeedTimeDay: number;
	/** The default directory to save torrents. */
	downloadDir: string;
	/** The free space in the download directory (in bytes). */
	downloadDirFreeSpace: number;
	/** Whether the session is in "queue" mode. */
	queueEnabled: boolean;
	/** Maximum number of active downloads. */
	queueSize: number;
	/** Maximum number of active uploads. */
	queueStalledSize: number;
	/** Whether stalled torrents are counted in the queue. */
	queueStalledEnabled: boolean;
	/** The RPC API version. */
	rpcVersion: number;
	/** The minimum RPC API version supported. */
	rpcVersionMinimum: number;
	/** The version of the Transmission daemon. */
	version: string;
	/** Whether the session is in "seed ratio" mode. */
	seedRatioLimited: boolean;
	/** The default seed ratio limit. */
	seedRatioLimit: number;
	/** Whether the session is in "seed idle" mode. */
	seedIdleLimited: boolean;
	/** The default seed idle limit (in minutes). */
	seedIdleLimit: number;
	/** The peer port used for incoming connections. */
	peerPort: number;
	/** Whether the peer port is randomized. */
	peerPortRandomOnStart: boolean;
	/** Whether port forwarding is enabled. */
	portForwardingEnabled: boolean;
	/** Whether the session is in "speed limit" mode. */
	speedLimitDownEnabled: boolean;
	/** Maximum download speed (in KB/s). */
	speedLimitDown: number;
	/** Whether the session is in "speed limit" mode for uploads. */
	speedLimitUpEnabled: boolean;
	/** Maximum upload speed (in KB/s). */
	speedLimitUp: number;
	/** Whether the session is in "start added torrents" mode. */
	startAddedTorrents: boolean;
	/** Whether the session is in "trash original torrent files" mode. */
	trashOriginalTorrentFiles: boolean;
	/** Whether the session is in "blocklist" mode. */
	blocklistEnabled: boolean;
	/** The number of entries in the blocklist. */
	blocklistSize: number;
	/** Whether the session is in "utp" mode. */
	utpEnabled: boolean;
	/** Whether the session is in "dht" mode. */
	dhtEnabled: boolean;
	/** Whether the session is in "pex" mode. */
	pexEnabled: boolean;
	/** Whether the session is in "lpd" mode. */
	lpdEnabled: boolean;
	/** Whether the session is in "encryption" mode. */
	encryption: string; // "required", "preferred", or "tolerated"
	/** Whether the session is in "automatic updates" mode. */
	autoUpdateEnabled: boolean;
	/** The last time the session was updated. */
	updateTime: number;
	/** Whether the session is in "watch directory" mode. */
	watchDirEnabled: boolean;
	/** The directory to watch for new torrents. */
	watchDir: string;
	/** Whether the session is in "incomplete directory" mode. */
	incompleteDirEnabled: boolean;
	/** The directory to store incomplete torrents. */
	incompleteDir: string;
	/** Whether the session is in "rename incomplete files" mode. */
	renameIncompleteFiles: boolean;
	/** Whether the session is in "script torrent done" mode. */
	scriptTorrentDoneEnabled: boolean;
	/** The script to run when a torrent finishes downloading. */
	scriptTorrentDoneFilename: string;
	/** Whether the session is in "idle seeding limit" mode. */
	idleSeedingLimitEnabled: boolean;
	/** The idle seeding limit (in minutes). */
	idleSeedingLimit: number;
	/** Whether the session is in "download queue" mode. */
	downloadQueueEnabled: boolean;
	/** The maximum number of active downloads. */
	downloadQueueSize: number;
	/** Whether the session is in "seed queue" mode. */
	seedQueueEnabled: boolean;
	/** The maximum number of active uploads. */
	seedQueueSize: number;
}

/**
 * Represents a torrent ID or a list of torrent IDs.
 */
export type ID = number | ReadonlyArray<string | number> | "recently-active";

/**
 * Represents arguments for getting torrents.
 */
export interface GetTorrentArgs<K extends keyof Torrent> {
	/** The IDs of the torrents to retrieve. */
	ids?: ID;
	/** The fields to retrieve for each torrent. */
	fields?: ReadonlyArray<K>;
}

/**
 * Represents the response from a get torrent request.
 */
export interface GetTorrentResponse<K extends keyof Torrent> {
	/** An array of removed torrents. */
	removed: ReadonlyArray<RemovedTorrent>;
	/** An array of torrents with the specified fields. */
	torrents: ReadonlyArray<Pick<Torrent, K>>;
}

/**
 * Represents arguments for adding a torrent.
 */
export interface AddTorrentArgs {
	/** Pointer to a string of one or more cookies. */
	cookies?: string;
	/** Path to download the torrent to. */
	downloadDir?: string;
	/** Filename or URL of the .torrent file or a magnet link. */
	filename?: string;
	/** Array of string labels. */
	labels?: ReadonlyArray<string>;
	/** Base64-encoded .torrent content. */
	metainfo?: string;
	/** If true, don't start the torrent. */
	paused?: boolean;
	/** Maximum number of peers. */
	peerLimit?: number;
	/** Torrent's bandwidth priority (e.g., -1, 0, 1). */
	bandwidthPriority?: number;
	/** Indices of file(s) to download. */
	filesWanted?: ReadonlyArray<number>;
	/** Indices of file(s) to not download. */
	filesUnwanted?: ReadonlyArray<number>;
	/** Indices of high-priority file(s). */
	priorityHigh?: ReadonlyArray<number>;
	/** Indices of low-priority file(s). */
	priorityLow?: ReadonlyArray<number>;
	/** Indices of normal-priority file(s). */
	priorityNormal?: ReadonlyArray<number>;
}

/**
 * Represents the response from an add torrent request.
 */
export interface AddTorrentResponse {
	/** The torrent that was added. */
	torrentAdded: {
		/** The unique ID of the torrent. */
		id: number;
		/** The name of the torrent. */
		name: string;
		/** The hash string of the torrent. */
		hashString: string;
	};
}

/**
 * Represents the response from a free space request.
 */
export interface FreeSpaceResponse {
	/** The path to the directory. */
	path: string;
	/** The free space in the directory (in bytes). */
	sizeBytes: number;
	/** The total size of the directory (in bytes). */
	totalSize: number;
}

/**
 * Represents arguments for modifying torrent properties.
 */
export interface TorrentSetArgs {
	/** The IDs of the torrents to modify. */
	ids: ReadonlyArray<number> | "recently-active";
	/** The bandwidth priority of the torrent (e.g., -1, 0, 1). */
	bandwidthPriority?: number;
	/** The maximum download speed in KB/s. */
	downloadLimit?: number;
	/** Whether the download speed limit is honored. */
	downloadLimited?: boolean;
	/** Indices of files to not download. */
	filesUnwanted?: ReadonlyArray<number>;
	/** Indices of files to download. */
	filesWanted?: ReadonlyArray<number>;
	/** The name of the torrent's bandwidth group. */
	group?: string;
	/** Whether the torrent honors session-wide speed limits. */
	honorsSessionLimits?: boolean;
	/** An array of string labels for the torrent. */
	labels?: ReadonlyArray<string>;
	/** The new location for the torrent's content. */
	location?: string;
	/** The maximum number of peers for the torrent. */
	peerLimit?: number;
	/** Indices of high-priority files. */
	priorityHigh?: ReadonlyArray<number>;
	/** Indices of low-priority files. */
	priorityLow?: ReadonlyArray<number>;
	/** Indices of normal-priority files. */
	priorityNormal?: ReadonlyArray<number>;
	/** The position of the torrent in its queue (0-based). */
	queuePosition?: number;
	/** The torrent-level number of minutes of seeding inactivity. */
	seedIdleLimit?: number;
	/** Which seeding inactivity mode to use (e.g., 0 = unlimited, 1 = limited by seedIdleLimit). */
	seedIdleMode?: number;
	/** The torrent-level seeding ratio limit. */
	seedRatioLimit?: number;
	/** Which seeding ratio mode to use (e.g., 0 = unlimited, 1 = limited by seedRatioLimit). */
	seedRatioMode?: number;
	/** Whether to download torrent pieces sequentially. */
	sequentialDownload?: boolean;
	/**
	 * A string of announce URLs, one per line, with a blank line between tiers.
	 * Use this instead of `trackerAdd`, `trackerRemove`, and `trackerReplace`.
	 */
	trackerList?: string;
	/**
	 * @deprecated Use `trackerList` instead.
	 * Adds new trackers to the torrent's tracker list.
	 */
	trackerAdd?: ReadonlyArray<string>;
	/**
	 * @deprecated Use `trackerList` instead.
	 * Removes trackers from the torrent's tracker list.
	 */
	trackerRemove?: ReadonlyArray<number>;
	/**
	 * @deprecated Use `trackerList` instead.
	 * Replaces the torrent's tracker list with new trackers.
	 */
	trackerReplace?: ReadonlyArray<{
		/** The index of the tracker to replace. */
		index: number;
		/** The new tracker URL. */
		url: string;
	}>;
	/** The maximum upload speed in KB/s. */
	uploadLimit?: number;
	/** Whether the upload speed limit is honored. */
	uploadLimited?: boolean;
}
